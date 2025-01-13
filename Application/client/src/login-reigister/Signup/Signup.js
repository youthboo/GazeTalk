import React, { useState } from 'react';
import { Form, Input, Button, Select, Checkbox, DatePicker, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Signup.module.css';
import axios from 'axios';

const { Option } = Select;

const Signup = () => {
    const [loading, setLoading] = useState(false);
    const [userType, setUserType] = useState('patient'); 
    const navigate = useNavigate();

    const onFinish = async (values) => {
        const { username, email, password, gender, dateOfBirth, code, privacyAgreement } = values;

        if (!privacyAgreement) {
            message.error('You must accept the Privacy Policy and Terms.');
            return;
        }

        if (userType === 'personnel' && (!code || (code !== 'SecretCodeAdmin' && code !== 'SKCode55'))) {
            message.error('Invalid code for personnel.');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                username,
                email, // เพิ่ม email ใน payload
                password,
                userType,
                ...(userType === 'personnel' && { code }),
                ...(userType === 'patient' && { gender, dateOfBirth: dateOfBirth.format('YYYY-MM-DD') }),
            };

            await axios.post('https://b60c-49-49-243-112.ngrok-free.app/api/auth/signup', payload);
            message.success('Signup successful!');
            navigate('/login');
        } catch (error) {
            message.error(error.response?.data?.message || 'Signup failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleUserTypeChange = (type) => {
        setUserType(type);
    };

    return (
        <div className={styles.signup_container}>
            <div className={styles.signup_form_container}>
                <div className={styles.left}>
                    <h1>Welcome Back</h1>
                    <Link to="/login">
                        <Button type="default" className={styles.white_btn}>
                            Sign in
                        </Button>
                    </Link>
                </div>
                <div className={styles.right}>
                    <Form
                        layout="vertical"
                        className={styles.form_container}
                        onFinish={onFinish}
                        initialValues={{ privacyAgreement: false }}
                    >
                        <h1>Create Account</h1>

                        <div className={styles.user_type_container}>
                            <button
                                type="button"
                                className={`${styles.user_type_btn} ${userType === 'patient' ? styles.active : ''}`}
                                onClick={() => handleUserTypeChange('patient')}
                            >
                                Patient
                            </button>
                            <button
                                type="button"
                                className={`${styles.user_type_btn} ${userType === 'personnel' ? styles.active : ''}`}
                                onClick={() => handleUserTypeChange('personnel')}
                            >
                                Personnel
                            </button>
                        </div>

                        <Form.Item
                            name="username"
                            label="Username"
                            rules={[{ required: true, message: 'Please enter your username!' }]}
                        >
                            <Input placeholder="Username" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: 'Please enter your email!' },
                                { type: 'email', message: 'Please enter a valid email!' },
                            ]}
                        >
                            <Input placeholder="Email" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[{ required: true, message: 'Please enter your password!' }]}
                        >
                            <Input.Password placeholder="Password" />
                        </Form.Item>

                        {userType === 'patient' && (
                            <>
                                <Form.Item
                                    name="gender"
                                    label="Gender (for Patients)"
                                    rules={[{ required: true, message: 'Please select your gender!' }]}
                                >
                                    <Select placeholder="Select gender">
                                        <Option value="male">Male</Option>
                                        <Option value="female">Female</Option>
                                        <Option value="other">Other</Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item
                                    name="dateOfBirth"
                                    label="Date of Birth (for Patients)"
                                    rules={[{ required: true, message: 'Please select your date of birth!' }]}
                                >
                                    <DatePicker
                                        format="YYYY-MM-DD"
                                        placeholder="Select Date"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </>
                        )}

                        {userType === 'personnel' && (
                            <Form.Item
                                name="code"
                                label="Code"
                                rules={[{ required: true, message: 'Please enter your personnel code!' }]}
                            >
                                <Input placeholder="Code" />
                            </Form.Item>
                        )}

                        <Form.Item
                            name="privacyAgreement"
                            valuePropName="checked"
                            rules={[
                                {
                                    validator: (_, value) =>
                                        value ? Promise.resolve() : Promise.reject(new Error('You must accept the Privacy Policy and Terms.')),
                                },
                            ]}
                        >
                            <Checkbox>
                                I accept the <Link to="/privacy-policy">Privacy Policy</Link> and <Link to="/terms">Terms</Link>.
                            </Checkbox>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} className={styles.green_btn}>
                                Sign Up
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default Signup;
