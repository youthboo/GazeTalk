import React, { useState } from 'react';
import { Form, Input, Button, Select, Checkbox, DatePicker, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Signup.module.css';
import axios from 'axios';
import Icon from "../../admins/assets/images/hospital.png";
import PrivacyTermsModal from '../../../src/admins/components/PrivacyTermsModal';

const { Option } = Select;

const Signup = () => {
    const [loading, setLoading] = useState(false);
    const [userType, setUserType] = useState('patient');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);
    const navigate = useNavigate();

    // Add debounced username/email check
    const checkExistingField = async (field, value, userType = null) => {
        try {
            let url = `${process.env.REACT_APP_GAZETALK_URL}/api/auth/check-${field}`;
            if (field === 'email' && userType) {
                url += `?email=${value}&userType=${userType}`;
            } else {
                url += `?${field}=${value}`;
            }
            
            const response = await axios.get(url);
            return response.data.exists;
        } catch (error) {
            console.error(`Error checking ${field}:`, error);
            return false;
        }
    };

    // Password validation rules
    const validatePassword = (_, value) => {
        const requirements = {
            minLength: value.length >= 8,
            hasUpperCase: /[A-Z]/.test(value),
            hasLowerCase: /[a-z]/.test(value),
            hasNumber: /\d/.test(value),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        };

        if (Object.values(requirements).every(Boolean)) {
            return Promise.resolve();
        }

        let errorMsg = 'Password must contain:';
        if (!requirements.minLength) errorMsg += ' at least 8 characters,';
        if (!requirements.hasUpperCase) errorMsg += ' uppercase letter,';
        if (!requirements.hasLowerCase) errorMsg += ' lowercase letter,';
        if (!requirements.hasNumber) errorMsg += ' number,';
        if (!requirements.hasSpecialChar) errorMsg += ' special character,';

        return Promise.reject(new Error(errorMsg.slice(0, -1)));
    };

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

            // Final check for username and email existence before submission
            const [usernameExists, emailExists] = await Promise.all([
                checkExistingField('username', username),
                checkExistingField('email', email)
            ]);

            if (usernameExists) {
                message.error('Username is already taken.');
                setLoading(false);
                return;
            }

            if (emailExists) {
                message.error('Email is already registered.');
                setLoading(false);
                return;
            }

            const payload = {
                username,
                email,
                password,
                userType,
                ...(userType === 'personnel' && { code }),
                ...(userType === 'patient' && { gender, dateOfBirth: dateOfBirth.format('YYYY-MM-DD') }),
            };

            await axios.post(`${process.env.REACT_APP_GAZETALK_URL}/api/auth/signup`, payload);
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
                    <img src={Icon} alt="Hospital Logo" className={styles.logologin} />
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
                            rules={[
                                { required: true, message: 'Please enter your username!' },
                                {
                                    validator: async (_, value) => {
                                        if (value) {
                                            const exists = await checkExistingField('username', value);
                                            if (exists) {
                                                throw new Error('This username is already taken');
                                            }
                                        }
                                    },
                                },
                            ]}
                            validateTrigger="onBlur"
                        >
                            <Input placeholder="Username" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: 'Please enter your email!' },
                                { type: 'email', message: 'Please enter a valid email!' },
                                {
                                    validator: async (_, value) => {
                                        if (value) {
                                            const exists = await checkExistingField('email', value);
                                            if (exists) {
                                                throw new Error('This email is already registered');
                                            }
                                        }
                                    },
                                },
                            ]}
                            validateTrigger="onBlur"
                        >
                            <Input placeholder="Email" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[
                                { required: true, message: 'Please enter your password!' },
                                { validator: validatePassword }
                            ]}
                            validateTrigger={['onChange', 'onBlur']}
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
                                I accept the 
                                <span style={{ color: 'blue', cursor: 'pointer', marginLeft: '5px' }} onClick={() => { setModalType('privacy'); setIsModalOpen(true); }}>Privacy Policy</span> 
                                and 
                                <span style={{ color: 'blue', cursor: 'pointer', marginLeft: '5px' }} onClick={() => { setModalType('terms'); setIsModalOpen(true); }}>Terms</span>.
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

            <PrivacyTermsModal isOpen={isModalOpen} type={modalType} onClose={() => setIsModalOpen(false)} />
        </div>
   
    );
};

export default Signup;