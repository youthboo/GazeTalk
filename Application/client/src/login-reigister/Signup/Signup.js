import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Signup.module.css';
import axios from 'axios';

const Signup = () => {
    const [data, setData] = useState({
        username: "",
        password: "",
        gender: "",
        dateOfBirth: "", 
        code: "" ,
        userType: ""
    });

    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = ({ currentTarget: input }) => {
        setData({ ...data, [input.name]: input.value });
    };

    const handleTypeChange = (type) => {
        setData({ ...data, userType: type });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // ตรวจสอบเงื่อนไขการกรอก code สำหรับ personnel
        if (data.userType === 'personnel') {
            if (data.code !== 'SecretCodeAdmin' && data.code !== 'SKCode55') {
                setError('Invalid code for personnel');
                return; // หยุดการส่งข้อมูลหาก code ไม่ถูกต้อง
            }
        }
    
        try {
            // ใช้ URL ที่เปลี่ยนแล้ว
            await axios.post('http://localhost:3008/api/auth/signup', {
                username: data.username,
                password: data.password,
                userType: data.userType,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender,
                code: data.code,
            });
            navigate('/login');
        } catch (error) {
            if (error.response && error.response.status >= 400 && error.response.status <= 500) {
                setError(error.response.data.message);
            }
        }
    };    

    return (
        <div className={styles.signup_container}>
            <div className={styles.signup_form_container}>
                <div className={styles.left}>
                    <h1>Welcome Back</h1>
                    <Link to='/login'>
                        <button type='button' className={styles.white_btn}>
                            Sign in
                        </button>
                    </Link>
                </div>
                <div className={styles.right}>
                    <form className={styles.form_container} onSubmit={handleSubmit}>
                        <h1>Create Account</h1>
                        <div className={styles.user_type_container}>
                            <button
                                type='button'
                                className={`${styles.user_type_btn} ${data.userType === 'patient' ? styles.active : ''}`}
                                onClick={() => handleTypeChange('patient')}
                            >
                                Patient
                            </button>
                            <button
                                type='button'
                                className={`${styles.user_type_btn} ${data.userType === 'personnel' ? styles.active : ''}`}
                                onClick={() => handleTypeChange('personnel')}
                            >
                                Personnel
                            </button>
                        </div>
                        {data.userType === 'patient' && (
                        <>
                            <input
                                type='text'
                                placeholder='Username'
                                name='username'
                                onChange={handleChange}
                                value={data.username}
                                required
                                className={styles.input}
                            />
                            <input
                                type='password'
                                placeholder='Password'
                                name='password'
                                onChange={handleChange}
                                value={data.password}
                                required
                                className={styles.input}
                            />

                            <select
                                name='gender'
                                onChange={handleChange}
                                value={data.gender}
                                required
                                className={styles.select}
                            >
                                <option value="" disabled hidden>Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                            <input
                                type='date'
                                placeholder='Date of Birth'
                                name='dateOfBirth'
                                onChange={handleChange}
                                value={data.dateOfBirth}
                                required
                                className={styles.input}
                            />
                        </>
                    )}

                        {data.userType === 'personnel' && (
                            <>
                                <input
                                    type='text'
                                    placeholder='Username'
                                    name='username'
                                    onChange={handleChange}
                                    value={data.username} 
                                    required
                                    className={styles.input}
                                />
                                <input
                                    type='password'
                                    placeholder='Password'
                                    name='password'
                                    onChange={handleChange}
                                    value={data.password}
                                    required
                                    className={styles.input}
                                />
                                <input
                                    type='text'
                                    placeholder='Code'
                                    name='code'
                                    onChange={handleChange}
                                    value={data.code}
                                    required
                                    className={styles.input}
                                />
                            </>
                        )}
                        {error && <div className={styles.error_msg}>{error}</div>}
                        <button type='submit' className={styles.green_btn}>
                            Sign Up
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;
