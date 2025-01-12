import React, { useState } from 'react';
import styles from './Login.module.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onLogin }) => {
    const [data, setData] = useState({
        username: "",
        password: "",
        code: "", 
    });
    
    const [error, setError] = useState('');
    const navigate = useNavigate();
    
    const handleChange = ({ currentTarget: input }) => {
        setData({ ...data, [input.name]: input.value });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3008/api/auth/login', {
                username: data.username,
                password: data.password,
                code: data.code,
            });
    
            const { token, isAdmin, patient_id, gender, ageRange, adminCode } = response.data;
    
            if (isAdmin) {
                // Admin
                localStorage.setItem('token', token);
                localStorage.setItem('isAdmin', 'true');
                localStorage.setItem('adminCode', adminCode);
                onLogin();
                navigate('/dashboard');
            } else {
                // Patient
                localStorage.setItem('token', token);
                localStorage.setItem('isAdmin', 'false');
                sessionStorage.setItem('patient_id', patient_id);
                sessionStorage.setItem('patient_gender', gender);
                sessionStorage.setItem('patient_age_range', ageRange);
                onLogin();
                navigate('/basic');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed.');
        }
    };
    
    

    return (
        <div className={styles.login_container}>
            <div className={styles.login_form_container}>
                <div className={styles.left}>
                    <form className={styles.form_container} onSubmit={handleSubmit}>
                        <h1>Login to Your Account</h1>
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
                            placeholder='Code (Only Personnel, optional)'
                            name='code'
                            onChange={handleChange}
                            value={data.code}
                            className={styles.input} 
                        />
                        {error && <div className={styles.error_msg}>{error}</div>} 
                        <button type='submit' className={styles.green_btn}>
                            Sign In
                        </button>
                    </form>
                </div>
                <div className={styles.right}>
                    <h1>New Here ?</h1>
                    <Link to='/signup'>
                        <button type='button' className={styles.white_btn}>
                            Sign Up
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
