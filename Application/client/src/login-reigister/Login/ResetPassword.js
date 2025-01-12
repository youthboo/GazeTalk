import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import axios from 'axios';
import styles from './ResetPassword.module.css';

const ResetPassword = () => {
    const { token } = useParams(); // ดึง token จาก URL
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        const { password } = values;
        try {
            setLoading(true);
            await axios.post('http://localhost:3008/api/auth/reset-password', {
                token,
                password,
            });
            message.success('Password has been reset successfully!');
            navigate('/login'); // นำผู้ใช้กลับไปยังหน้า login
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.reset_password_container}>
            <Form
                layout="vertical"
                className={styles.form_container}
                onFinish={onFinish}
            >
                <h1>Reset Password</h1>
                <Form.Item
                    name="password"
                    label="New Password"
                    rules={[
                        { required: true, message: 'Please enter your new password!' },
                        { min: 6, message: 'Password must be at least 6 characters.' },
                    ]}
                >
                    <Input.Password placeholder="Enter your new password" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} className={styles.green_btn}>
                    Reset Password
                </Button>
            </Form>
        </div>
    );
};

export default ResetPassword;
