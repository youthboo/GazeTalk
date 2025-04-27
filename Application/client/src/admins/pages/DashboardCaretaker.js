import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Row, Col, Card, Spin } from "antd";
import "./DashboardCaretaker.css";
import QrCode from "../assets/images/qr.png";

ChartJS.register(ArcElement, Tooltip, Legend);

const DashboardCaretaker = () => {
  const [patientData, setPatientData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [windowSize, setWindowSize] = useState(window.innerWidth);

  useEffect(() => {
    axios
      .get("http://localhost:3008/api/dashboard")  //ตอน deploy แก้เป็น http://202.44.40.178:85/api/dashboard
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
      setWindowSize(window.innerWidth);
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
        position: 'right',
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
    <div className="dashboard-caretaker">
      <h1>Caretaker Dashboard</h1>

      <Row gutter={[16, 16]} className="chart-row">
        <Col xs={24} md={24} lg={24}>
          <Card title="Patient Age Distribution (%)" bordered>
            <div className="chart-container">
              <Pie key={windowSize} data={ageChartData} options={chartOptions} />
            </div>
          </Card>
        </Col>
      </Row>

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

export default DashboardCaretaker;