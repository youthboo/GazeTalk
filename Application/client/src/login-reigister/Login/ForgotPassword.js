import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import axios from 'axios';
import styles from './ForgotPassword.module.css';

const ForgotPassword = () => {
    const [loading, setLoading] = useState(false);

    const onFinish = async (values) => {
        const { email } = values;
        try {
            setLoading(true);
            await axios.post('http://localhost:3008/api/auth/forgot-password', { email });
            message.success('Password reset link has been sent to your email.');
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to send reset link.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.forgot_password_container}>
            <Form
                layout="vertical"
                className={styles.form_container}
                onFinish={onFinish}
            >
                <h1>Forgot Password</h1>
                <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                        { required: true, message: 'Please enter your email!' },
                        { type: 'email', message: 'Please enter a valid email!' },
                    ]}
                >
                    <Input placeholder="Enter your email" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} className={styles.green_btn}>
                    Send Reset Link
                </Button>
            </Form>
        </div>
    );
};

export default ForgotPassword;
