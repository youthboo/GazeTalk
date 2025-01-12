import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Select, message, Layout, Card, Space } from 'antd';
import './AddLineIDForm.css';

const { Option } = Select;
const { Content } = Layout;

const AddLineIDForm = ({ onSubmit, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const patient = useMemo(() => location.state?.patient || {}, [location.state]);

  useEffect(() => {
    if (!patient.patient_id) {
      console.error('Patient ID is missing');
    }
  }, [patient]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: '',
    email: '',
    telegramID: ''
  });

  // eslint-disable-next-line
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (values) => {
    if (!patient.patient_id) {
      message.error('Patient ID is missing. Please select a patient before submitting.');
      return;
    }

    const dataToSend = {
      telegramID: values.telegramID,
      patient_id: patient.patient_id,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      role: values.role,
      email: values.email
    };

    axios.post('http://localhost:3008/api/relative/relative-chat', dataToSend)
      .then(response => {
        console.log('Data saved successfully:', response.data);
        if (onSubmit) onSubmit();
        navigate(-1); // ย้อนกลับไปยังหน้าก่อนหน้า
      })
      .catch(error => {
        console.error('Error saving data:', error);
      });
  };

  return (
    <Layout className="add-line-id-container">
      <Content className="add-line-id-content">
        <Card
          className="add-line-id-card"
          title={<h3>Add Telegram ID</h3>}
        >
          {patient.name && (
            <div className="patient-info">
              <h4>Patient: {patient.name}</h4>
            </div>
          )}
          <Form
            name="add-line-id-form"
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={formData}
            className="add-line-id-form"
          >
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: 'Please input the first name!' }]}
            >
              <Input placeholder="First Name" />
            </Form.Item>
            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: 'Please input the last name!' }]}
            >
              <Input placeholder="Last Name" />
            </Form.Item>
            <Form.Item
              label="Phone/Mobile"
              name="phone"
              rules={[{ required: true, message: 'Please input the phone number!' }]}
            >
              <Input placeholder="Phone/Mobile Number" />
            </Form.Item>
            <Form.Item
              label="Role"
              name="role"
              rules={[{ required: true, message: 'Please select a role!' }]}
            >
              <Select placeholder="Select Role">
                <Option value="Notifier">Notifier</Option>
                <Option value="Receiver">Receiver</Option>
                <Option value="Notifier/Receiver">Notifier/Receiver</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please input the email!' },
                { type: 'email', message: 'Please input a valid email!' }
              ]}
            >
              <Input placeholder="Email" />
            </Form.Item>
            <Form.Item
              label="Telegram ID"
              name="telegramID"
              rules={[{ required: true, message: 'Please input the Telegram ID!' }]}
            >
              <Input placeholder="Telegram ID" />
            </Form.Item>
            <Form.Item className="form-actions">
              <Space>
                <Button type="primary" htmlType="submit" className="submit-btn">
                  Save
                </Button>
                <Button type="default" onClick={() => navigate(-1)} className="cancel-btn">
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default AddLineIDForm;
