import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Table, Input, Button, message, Modal, Layout, Typography, Card } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import './AddLineID.css';

const { Content } = Layout;
const { Title } = Typography;

const AddLineID = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_GAZETALK_URL}/api/patients`);
      setPatients(response.data);
      setFilteredPatients(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      message.error('ไม่สามารถโหลดข้อมูลผู้ป่วยได้');
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    const filtered = patients.filter(
      (patient) =>
        patient.username.toLowerCase().includes(value) ||
        patient.gender.toLowerCase().includes(value)
    );
    setFilteredPatients(filtered);
  };

  const handleViewPatient = (patient) => {
    navigate(`/admin/patient/${patient.patient_id}`);
  };

  const handleDeletePatient = (patientId) => {
    Modal.confirm({
      title: 'ยืนยันการลบข้อมูล',
      content: 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลผู้ป่วยนี้?',
      okText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          await axios.delete(`${process.env.REACT_APP_GAZETALK_URL}/api/patients/${patientId}`);
          const updatedPatients = patients.filter((patient) => patient.patient_id !== patientId);
          setPatients(updatedPatients);
          setFilteredPatients(updatedPatients);
          message.success('ลบข้อมูลผู้ป่วยสำเร็จ');
        } catch (error) {
          console.error('ลบข้อมูลไม่สำเร็จ:', error);
          message.error('ลบข้อมูลผู้ป่วยไม่สำเร็จ');
        }
      },
    });
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
  

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
      width: '25%',
      render: (text) => <span className="text-primary">{text}</span>
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      width: '15%',
      render: (text) => <span className="text-secondary">{text}</span>
    },
    {
      title: 'Date of Birth',
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      render: (text) => formatThaiDate(text),
      sorter: (a, b) => new Date(a.dateOfBirth) - new Date(b.dateOfBirth),
      width: '20%',
    },
    
    {
      title: 'Actions',
      key: 'actions',
      render: (_, patient) => (
        <div className="patient-actions">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => handleViewPatient(patient)}
            size="small"
            className="mr-2"
          />
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeletePatient(patient.patient_id)}
            size="small"
          />
        </div>
      ),
      width: '20%',
      align: 'center',
    },
  ];

  return (
    <Layout className="patient-list-container bg-gray-100 min-h-screen">
      <Content className="p-6">
        <div className="patient-container">
          <Card 
            className="shadow-lg rounded-lg"
            title={
              <div className="flex justify-between items-center">
                <Title level={3} className="mb-0 text-primary">
                  <TeamOutlined style={{ marginRight: '12px' }} />
                  ตารางแสดงรายชื่อของผู้ป่วยทั้งหมด 
                </Title>
              </div>
            }
          >
            <div className="search-wrapper mb-4">
              <Input
                className="patient-search-input"
                placeholder="ค้นหาจาก Username หรือ Gender ของผู้ป่วย"
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={handleSearch}
                allowClear
                size="large"
              />
            </div>
            
            <Table
              key={windowWidth} 
              columns={columns}
              dataSource={filteredPatients}
              rowKey="patient_id"
              loading={loading}
              pagination={{
                pageSize: 5,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`
              }}
              className="patient-table"
              size="middle"
            />
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default AddLineID;