import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar, Doughnut } from "react-chartjs-2";
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
  const [windowSize, setWindowSize] = useState(window.innerWidth); // ติดตามขนาดหน้าจอ

  useEffect(() => {
    // ใช้ URL จาก .env
    const apiUrl = process.env.REACT_APP_API_URL; // URL API จาก .env
    axios
      .get(`${apiUrl}/api/dashboard/dashboard`) // เชื่อมต่อ API ผ่านค่าจาก .env
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

  // Chart Options (แก้ไขให้ responsive)
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  // Chart Data
  const genderChartData = {
    labels: ["Male", "Female", "Other"],
    datasets: [
      {
        label: "Patient Count by Gender",
        data: [patientData.male || 0, patientData.female || 0, patientData.other || 0],
        backgroundColor: ["rgba(75, 192, 192, 0.2)", "rgba(255, 99, 132, 0.2)", "rgba(153, 102, 255, 0.2)"],
        borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)", "rgba(153, 102, 255, 1)"],
        borderWidth: 1,
      },
    ],
  };

  const ageChartData = {
    labels: ["13-19", "20-39", "40-59", "60+"],
    datasets: [
      {
        label: "Patients by Age Range",
        data: [
          patientData.ageGroups?.["13-19"] || 0,
          patientData.ageGroups?.["20-39"] || 0,
          patientData.ageGroups?.["40-59"] || 0,
          patientData.ageGroups?.["60-120"] || 0,
        ],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
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
            <h3>Total Users</h3>
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
        <Col xs={24} md={12}>
          <Row gutter={[16, 16]}>
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

            <Col span={24}>
              <Card title="Patient Count by Gender" bordered>
                <div className="chart-container">
                  <Bar key={windowSize} data={genderChartData} options={chartOptions} />
                </div>
              </Card>
            </Col>
          </Row>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Patient Count by Age Range" bordered style={{ marginTop: 20 }}>
            <div className="chart-container">
              <Doughnut key={windowSize} data={ageChartData} options={chartOptions} />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;