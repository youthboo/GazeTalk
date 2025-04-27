import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Card, Typography, message, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './PatientSearchPage.css'; // จะเขียน css น่ารักๆ เพิ่มได้เลย

const { Title, Text } = Typography;

const PatientSearchPage = () => {
  const [username, setUsername] = useState('');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!username.trim()) {
      message.warning('กรุณากรอก Username');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_GAZETALK_URL}/api/patients`);
      const patients = response.data;

      const foundPatient = patients.find(p => p.username.toLowerCase() === username.toLowerCase());

      if (foundPatient) {
        setPatient(foundPatient);
      } else {
        setPatient(null);
        message.error('ไม่พบผู้ป่วยที่มี Username นี้');
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      message.error('เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      setLoading(false);
    }
  };

  const handleView = () => {
    if (patient) {
      navigate(`/admin/patient/${patient.patient_id}`);
    }
  };

  const formatThaiDate = (dateString) => {
    const date = new Date(dateString);
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // แปลง ค.ศ. -> พ.ศ.

    return `${day} ${month} ${year}`;
  };

  return (
    <div className="patient-search-container">
      <Card className="search-card">
        <Title level={3}>ค้นหาข้อมูลผู้ป่วยด้วย Username</Title>
        <Input
          placeholder="กรอก Username ของผู้ป่วย"
          prefix={<SearchOutlined />}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onPressEnter={handleSearch}
          size="large"
          className="mb-4"
        />
        <Button 
          type="primary" 
          onClick={handleSearch}
          size="large"
          block
        >
          ค้นหา
        </Button>

        {loading && <Spin className="mt-4" />}
        
        {patient && (
          <Card className="result-card mt-4" bordered={true}>
            <Title level={4}>ข้อมูลผู้ป่วย</Title>
            <p><Text strong>Username:</Text> {patient.username}</p>
            <p><Text strong>Gender:</Text> {patient.gender}</p>
            <p><Text strong>Date of Birth:</Text> {formatThaiDate(patient.dateOfBirth)}</p>
            <Button type="primary" onClick={handleView} className="mt-4">
              เพิ่มข้อมูลผู้เกี่ยวข้อง
            </Button>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default PatientSearchPage;
