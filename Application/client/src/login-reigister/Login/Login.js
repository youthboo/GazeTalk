import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Login.module.css';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import Icon from "../../admins/assets/images/hospital.png"

const Login = ({ onLogin }) => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        const { username, password, code, remember } = values;
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:3008/api/auth/login', {
                username,
                password,
                code,
            });

            const { token, isAdmin, patient_id, gender, ageRange, adminCode, role } = response.data;

            if (!isAdmin && code) {
                navigate('/access-denied');
                return;
            }

            if (isAdmin) {
                localStorage.setItem('token', token);
                localStorage.setItem('isAdmin', 'true');
                localStorage.setItem('adminCode', adminCode);
                onLogin();
                navigate('/admin/dashboard');
            } else {
                localStorage.setItem('token', token);
                localStorage.setItem('isAdmin', 'false');
                sessionStorage.setItem('patient_id', patient_id);
                sessionStorage.setItem('patient_gender', gender);
                sessionStorage.setItem('patient_age_range', ageRange);
                sessionStorage.setItem('role', role);
                onLogin();
                navigate('/basic');
            }

            if (remember) {
                localStorage.setItem('rememberUser', username);
            } else {
                localStorage.removeItem('rememberUser');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.login_container}>
            <div className={styles.login_form_container}>
                <div className={styles.left}>
                    <Form
                        className={styles.form_container}
                        onFinish={onFinish}
                        initialValues={{
                            remember: true,
                            username: localStorage.getItem('rememberUser') || '',
                        }}
                    >
                        <h1>Login to Your Account</h1>
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: 'Please enter your username!' }]}
                        >
                            <Input placeholder="Username" />
                        </Form.Item>
                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Please enter your password!' }]}
                        >
                            <Input.Password
                                placeholder="Password"
                                iconRender={(visible) =>
                                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                                }
                            />
                        </Form.Item>
                        <Form.Item name="code">
                            <Input placeholder="Code (Only Personnel, optional)" />
                        </Form.Item>
                        <div className={styles.extra_options}>
                            <Form.Item name="remember" valuePropName="checked" noStyle>
                                <Checkbox>Remember Me</Checkbox>
                            </Form.Item>
                            <Link to="/forgot-password" className={styles.forgot_password}>
                                Forgot Password?
                            </Link>
                        </div>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className={styles.green_btn}
                            loading={loading}
                        >
                            Sign In
                        </Button>
                    </Form>
                </div>
                <div className={styles.right}>
                    <img src={Icon} alt="Hospital Logo" className={styles.logologin} />
                    <h1>Get Started!</h1>
                    <Link to="/signup">
                        <Button className={styles.white_btn}>Sign Up</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
