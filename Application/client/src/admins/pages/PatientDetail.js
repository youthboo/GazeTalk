import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Button, Space, Typography, Modal, Layout, Card, message } from 'antd';
import { EyeOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import axios from 'axios';
import './PatientDetail.css';

const { Title } = Typography;
const { Content } = Layout;

const PatientDetail = () => {
  const [relatedPeople, setRelatedPeople] = useState([]);
  const [selectedRelative, setSelectedRelative] = useState(null); 
  const [isModalVisible, setIsModalVisible] = useState(false); 
  const { id } = useParams(); // patient_id
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRelatives = async () => {
      try {
        const response = await axios.get(`http://localhost:3008/api/relative/patients/${id}/relatives`);
        setRelatedPeople(response.data);
      } catch (error) {
        console.error('มีข้อผิดพลาดในการดึงข้อมูลญาติ:', error);
        if (error.response && error.response.status === 404) {
          setRelatedPeople([]);
        }
      }
    };
    fetchRelatives();
  }, [id]);

  const handleAddPerson = () => {
    navigate('/admin/addlineform', { state: { patient: { patient_id: id } } });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleView = (relativeId) => {
    // ค้นหาข้อมูลของญาติจากรายการ
    const relative = relatedPeople.find((r) => r.telegramID === relativeId);
    setSelectedRelative(relative); 
    setIsModalVisible(true); 
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedRelative(null); 
  };

  const handleDelete = (telegramID) => {
    Modal.confirm({
      title: 'ยืนยันการลบข้อมูล',
      content: 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?',
      okText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          await axios.delete(`http://localhost:3008/api/relative/relative/${telegramID}`);
          message.success('ลบข้อมูลสำเร็จ');
          // อัปเดตรายการญาติหลังการลบ
          setRelatedPeople((prev) =>
            prev.filter((relative) => relative.telegramID !== telegramID)
          );
        } catch (error) {
          console.error('Error deleting relative:', error);
          message.error('ลบข้อมูลไม่สำเร็จ');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Telegram ID',
      dataIndex: 'telegramID',
      key: 'telegramID',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            type="primary"
            onClick={() => handleView(record.telegramID)}
          />
          <Button
            icon={<DeleteOutlined />}
            type="primary"
            danger
            onClick={() => handleDelete(record.telegramID)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Layout className="patient-detail-container">
      <Content className="patient-detail-content">
        <Card
          className="patient-detail-card"
          title={
            <Space>
              <UserAddOutlined /> <Title level={3}>Related People</Title>
            </Space>
          }
        >
          <Table
            dataSource={relatedPeople}
            columns={columns}
            rowKey={(record) => record.telegramID}
            pagination={false}
            locale={{ emptyText: 'ยังไม่มีข้อมูลของญาติคนไข้' }}
            scroll={{ x: '100%', y: 400 }}
          />

          <Space style={{ marginTop: '20px' }}>
            <Button onClick={handleAddPerson} type="primary">
              Add New Person
            </Button>
            <Button onClick={handleBack}>Back</Button>
          </Space>
        </Card>

        {/* Modal สำหรับแสดงรายละเอียดของญาติ */}
        <Modal
          title="รายละเอียดของญาติ"
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
        >
          {selectedRelative ? (
            <div>
              <p>
                <strong>ชื่อ:</strong> {selectedRelative.firstName} {selectedRelative.lastName}
              </p>
              <p>
                <strong>โทรศัพท์:</strong> {selectedRelative.phone}
              </p>
              <p>
                <strong>อีเมล:</strong> {selectedRelative.email}
              </p>
              <p>
                <strong>บทบาท:</strong> {selectedRelative.role}
              </p>
              <p>
                <strong>Telegram ID:</strong> {selectedRelative.telegramID}
              </p>
            </div>
          ) : (
            <p>กำลังโหลดข้อมูล...</p>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default PatientDetail;
