import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Row, Col, Card, Spin } from "antd";
import {
  UserOutlined,
  ManOutlined,
  WomanOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import "./Dashboard.css";
import QrCode from "../assets/images/qr.png";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [patientData, setPatientData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [windowSize, setWindowSize] = useState(window.innerWidth); 

  useEffect(() => {
    axios
      .get("http://202.44.40.178:85/api/dashboard") //ตอน deploy แก้เป็น http://202.44.40.178:85/api/dashboard http://localhost:3008/api/dashboard
      .then((response) => {
        const { patientData } = response.data;
        setPatientData(patientData);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching dashboard data:", error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(window.innerWidth); // รีเรนเดอร์เมื่อหน้าจอเปลี่ยนขนาด
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          generateLabels: (chart) => {
            return [
              {
                text: 'Male',
                fillStyle: 'rgba(75, 192, 192, 0.5)',
                strokeStyle: 'rgba(75, 192, 192, 1)',
                hidden: false,
              },
              {
                text: 'Female',
                fillStyle: 'rgba(255, 99, 132, 0.5)',
                strokeStyle: 'rgba(255, 99, 132, 1)',
                hidden: false,
              },
              {
                text: 'Other',
                fillStyle: 'rgba(153, 102, 255, 0.5)',
                strokeStyle: 'rgba(153, 102, 255, 1)',
                hidden: false,
              },
            ];
          },
        },
        onClick: (e) => {
          // ไม่ทำอะไรเลยตอนคลิก legend
          e.native.stopImmediatePropagation();
        },
      },
    },
  };
  
  const genderChartData = {
    labels: ["Male", "Female", "Other"],
    datasets: [
      {
        label: "Patient Count by Gender",
        data: [patientData.male || 0, patientData.female || 0, patientData.other || 0],
        backgroundColor: [
          "rgba(75, 192, 192, 0.5)",
          "rgba(255, 99, 132, 0.5)",
          "rgba(153, 102, 255, 0.5)"
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(153, 102, 255, 1)"
        ],
        borderWidth: 1,
      },
    ],
  };  

// สร้าง options ใหม่สำหรับ Age Chart
const ageChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        generateLabels: (chart) => {
          return [
            {
              text: '13-19',
              fillStyle: '#FF6384',
              strokeStyle: '#FF6384',
              hidden: false,
            },
            {
              text: '20-39',
              fillStyle: '#36A2EB',
              strokeStyle: '#36A2EB',
              hidden: false,
            },
            {
              text: '40-59',
              fillStyle: '#FFCE56',
              strokeStyle: '#FFCE56',
              hidden: false,
            },
            {
              text: '60+',
              fillStyle: '#4BC0C0',
              strokeStyle: '#4BC0C0',
              hidden: false,
            },
          ];
        },
      },
    },
  },
};
  
// Calculate total patients in all age groups
const totalAgePatients = 
  (patientData.ageGroups?.["13-19"] || 0) +
  (patientData.ageGroups?.["20-39"] || 0) +
  (patientData.ageGroups?.["40-59"] || 0) +
  (patientData.ageGroups?.["60-120"] || 0);

// Chart Data for Age in Percentage
const ageChartData = {
  labels: ["13-19", "20-39", "40-59", "60+"],
  datasets: [
    {
      label: "Patients by Age Range (%)",
      data: [
        totalAgePatients > 0 ? ((patientData.ageGroups?.["13-19"] || 0) / totalAgePatients * 100).toFixed(1) : 0,
        totalAgePatients > 0 ? ((patientData.ageGroups?.["20-39"] || 0) / totalAgePatients * 100).toFixed(1) : 0,
        totalAgePatients > 0 ? ((patientData.ageGroups?.["40-59"] || 0) / totalAgePatients * 100).toFixed(1) : 0,
        totalAgePatients > 0 ? ((patientData.ageGroups?.["60-120"] || 0) / totalAgePatients * 100).toFixed(1) : 0,
      ],
      backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
      borderColor: "#ffffff",
      borderWidth: 2,
    },
  ],
};
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered className="stat-card">
            <UserOutlined style={{ fontSize: "2rem", color: "#1890ff" }} />
            <h3>Total Patients</h3>
            <p>{patientData.total || 0}</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered className="stat-card">
            <ManOutlined style={{ fontSize: "2rem", color: "#52c41a" }} />
            <h3>Male</h3>
            <p>{patientData.male || 0}</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered className="stat-card">
            <WomanOutlined style={{ fontSize: "2rem", color: "#eb2f96" }} />
            <h3>Female</h3>
            <p>{patientData.female || 0}</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered className="stat-card">
            <SmileOutlined style={{ fontSize: "2rem", color: "#722ed1" }} />
            <h3>Other</h3>
            <p>{patientData.other || 0}</p>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        {/* กราฟอยู่แถวเดียวกัน */}
        <Col xs={24} md={12}>
          <Card title="Patient Count by Gender" bordered>
            <div className="chart-container">
              <Bar key={windowSize} data={genderChartData} options={chartOptions} />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Patient Count by Age Range (%)" bordered>
            <div className="chart-container">
              <Pie key={windowSize} data={ageChartData} options={ageChartOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* QR Code ย้ายมาแถวล่างสุด */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col span={24}>
          <Card bordered title="QR Code สแกนเพื่อเชื่อมต่อกับผู้ป่วยผ่าน GazeTalk Bot">
            <p>พิมพ์ /start ในช่องแชทเพื่อรับ Telegram ID</p>
            <img
              src={QrCode}
              alt="QR Code"
              className="qr-code-img"
              style={{ width: "300px", display: "block", margin: "0 auto" }}
            />
          </Card>
        </Col>
      </Row>

    </div>
  );
};

export default Dashboard;