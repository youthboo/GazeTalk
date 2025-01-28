import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Table, Input, Button, message, Modal, Layout, Row, Typography, Card } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import './AddLineID.css';

const { Content } = Layout;
const { Title } = Typography;

const AddLineID = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
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
    console.log('Patient ID to delete:', patientId); // เพิ่มตรงนี้
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
      sorter: (a, b) => a.gender.localeCompare(b.gender),
      width: '15%',
      render: (text) => <span className="text-secondary">{text}</span>
    },
    {
      title: 'Date of Birth',
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      render: (text) => new Date(text).toLocaleDateString('th-TH'),
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
        <Row gutter={[16, 16]} justify="center">
            <Card 
              className="shadow-lg rounded-lg"
              title={
                <div className="flex justify-between items-center">
                  <Title level={3} className="mb-0 text-primary">
                    <UserAddOutlined className="mr-2" />
                    เพิ่มญาติ (Add Relative ID)
                  </Title>
                 
                </div>
              }
            >
              <div className="search-wrapper mb-4">
                <Input
                  className="patient-search-input"
                  placeholder="ค้นหาจากชื่อผู้ใช้หรือเพศ"
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={handleSearch}
                  allowClear
                  size="large"
                />
              </div>
              
              <Table
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
                scroll={{ x: '100%', y: 1000 }}
                size="middle"
              />
            </Card>

        </Row>
      </Content>
    </Layout>
  );
};

export default AddLineID;