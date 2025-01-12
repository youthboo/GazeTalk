import React from 'react';
import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

const AccessDenied = () => {
    return (
        <Result
            status="403"
            title="403"
            subTitle="Sorry, you do not have permission to view this page."
            extra={
                <Link to="/login">
                    <Button type="primary">Go to Login</Button>
                </Link>
            }
        />
    );
};

export default AccessDenied;
