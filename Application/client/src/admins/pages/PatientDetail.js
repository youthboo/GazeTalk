import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Button, Space, Typography, Modal, Layout, Card, message, Form, Input, Select } from 'antd';
import { EyeOutlined, DeleteOutlined, SolutionOutlined } from '@ant-design/icons';
import axios from 'axios';
import './PatientDetail.css';

const { Title } = Typography;
const { Content } = Layout;
const { Option } = Select;

const PatientDetail = () => {
  const [relatedPeople, setRelatedPeople] = useState([]);
  const [selectedRelative, setSelectedRelative] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm(); 
  const { id } = useParams(); // patient_id
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRelatives = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_GAZETALK_URL}/api/relative/patients/${id}/relatives`);
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
    const relative = relatedPeople.find((r) => r.telegramID === relativeId);
    setSelectedRelative(relative); // อัปเดตข้อมูลญาติที่เลือก
    setIsModalVisible(true);
  };

  useEffect(() => {
    if (selectedRelative) {
      form.setFieldsValue(selectedRelative);
    }
  }, [selectedRelative, form]);

  const handleUpdate = async (values) => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_GAZETALK_URL}/api/relative/relative/${selectedRelative.telegramID}`, values);
      message.success('อัพเดตข้อมูลสำเร็จ');

      setRelatedPeople((prev) =>
        prev.map((relative) =>
          relative.telegramID === selectedRelative.telegramID ? response.data.data : relative
        )
      );

      setIsModalVisible(false);
      setSelectedRelative(null); 
    } catch (error) {
      console.error('Error updating relative:', error);
      message.error('อัพเดตข้อมูลไม่สำเร็จ');
    }
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
          await axios.delete(`${process.env.REACT_APP_GAZETALK_URL}/api/relative/relative/${telegramID}`);
          message.success('ลบข้อมูลสำเร็จ');
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
            <div className="flex justify-between items-center">
              <Title level={3} className="mb-0 text-primary">
                <SolutionOutlined style={{ marginRight: '12px' }} />
                ตารางแสดงข้อมูลผู้เกี่ยวข้องทั้งหมด
              </Title>
            </div>
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
              เพิ่มผู้เกี่ยวข้อง
            </Button>
            <Button onClick={handleBack}>ย้อนกลับ</Button>
          </Space>
        </Card>

        {/* Modal สำหรับแก้ไขข้อมูลญาติ */}
        <Modal
          title="แก้ไขข้อมูลญาติ"
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
        >
          {selectedRelative && (
            <Form
              layout="vertical"
              form={form} // ใช้ form instance ที่สร้าง
              onFinish={handleUpdate}
            >
              <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                <Select>
                  <Option value="Notifier">Notifier</Option>
                  <Option value="Receiver">Receiver</Option>
                  <Option value="Notifier/Receiver">Notifier/Receiver</Option>
                </Select>
              </Form.Item>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
              </Form.Item>
            </Form>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default PatientDetail;
