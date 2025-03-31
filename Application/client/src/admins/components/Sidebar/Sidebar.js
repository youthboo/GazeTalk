import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import { 
  DashboardOutlined, 
  UserAddOutlined, 
  EditOutlined, 
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined 
} from '@ant-design/icons';
import Swal from 'sweetalert2';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import hospitalLogo from '../../assets/images/hospital.png';
import EditWord from '../../pages/EditWord';
import Dashboard from '../../pages/Dashboard';
import AddLineID from '../../pages/AddLineID';
import PatientDetail from '../../pages/PatientDetail';
import AddLineIDForm from '../../pages/AddLineIDForm';

const { Sider, Content, Header } = Layout;

const Sidebar = ({ onLogout, adminCode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedMenuKey, setSelectedMenuKey] = useState('/dashboard'); // กำหนดค่าเริ่มต้น
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState('');

  // ฟังก์ชันสุ่ม avatar
  const generateRandomAvatar = () => {
    const topTypes = ['ShortHairDreads01', 'ShortHairFrizzle', 'LongHairStraight01', 'Hat'];
    const facialHairTypes = ['BeardMedium', 'BeardLight', 'Blank'];
    const clotheTypes = ['BlazerShirt', 'ShirtCrewNeck', 'Hoodie', 'Overall'];
    const eyeTypes = ['Default', 'Happy', 'Surprised', 'Sad'];
    const mouthTypes = ['Default', 'Smile', 'Twinkle', 'Sad'];
    const skinColors = ['Light', 'Dark', 'Brown'];

    const randomTopType = topTypes[Math.floor(Math.random() * topTypes.length)];
    const randomFacialHairType = facialHairTypes[Math.floor(Math.random() * facialHairTypes.length)];
    const randomClotheType = clotheTypes[Math.floor(Math.random() * clotheTypes.length)];
    const randomEyeType = eyeTypes[Math.floor(Math.random() * eyeTypes.length)];
    const randomMouthType = mouthTypes[Math.floor(Math.random() * mouthTypes.length)];
    const randomSkinColor = skinColors[Math.floor(Math.random() * skinColors.length)];

    return `https://avataaars.io/?avatarStyle=Circle&topType=${randomTopType}&facialHairType=${randomFacialHairType}&clotheType=${randomClotheType}&eyeType=${randomEyeType}&mouthType=${randomMouthType}&skinColor=${randomSkinColor}`;
  };

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // อัปเดต selectedMenuKey เมื่อ location.pathname เปลี่ยน
  useEffect(() => {
    setSelectedMenuKey(location.pathname);
  }, [location.pathname]);

  const handleNavigation = (path) => {
    if (path === '/logout') {
      Swal.fire({
        title: 'คุณแน่ใจหรือไม่?',
        text: 'คุณจะออกจากระบบ!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ใช่, ออกจากระบบ!',
        cancelButtonText: 'ยกเลิก',
      }).then((result) => {
        if (result.isConfirmed) {
          onLogout(); 
          navigate('/login'); 
        }
      });
    } else {
      navigate(path); 
    }
  };
  
  useEffect(() => {
    setAvatarUrl(generateRandomAvatar());
  }, []); // เรียกใช้ตอน component mount

  const adminMenuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    ...(adminCode === 'SKCode55' || adminCode === 'SecretCodeAdmin' ? [
      {
        key: '/admin/addline',
        icon: <UserAddOutlined />,
        label: 'Add Relative ID',
      },
    ] : []),
    ...(adminCode === 'SKCode55' ? [
      {
        key: '/admin/editword',
        icon: <EditOutlined />,
        label: 'Edit Word',
      },
    ] : []),
  ];
  

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '64px',
            background: '#001529',
          }}
        >
          <img
            src={hospitalLogo}
            alt="App Logo"
            style={{
              height: '40px',
              marginRight: collapsed ? 0 : '10px',
            }}
          />
          {!collapsed && <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>GazeTalk</span>}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenuKey]} 
          onClick={({ key }) => handleNavigation(key)}
        >
          {adminMenuItems.map((item) => (
            <Menu.Item key={item.key} icon={<span style={{ fontSize: '20px' }}>{item.icon}</span>}>
              {item.label}
            </Menu.Item>
          ))}
          <Menu.Item
            key="/logout"
            icon={<LogoutOutlined />}
          >
            Logout
          </Menu.Item>
        </Menu>
      </Sider>

      <Layout
        style={{
          marginLeft: collapsed ? 80 : 250,
          transition: 'margin-left 0.2s',
        }}
      >
        <Header
          style={{
            background: '#fff',
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            onClick: () => setCollapsed(!collapsed),
            style: { fontSize: '18px', cursor: 'pointer' },
          })}

          <Dropdown
            overlay={
              <Menu>
                <Menu.Item
                  key="logout"
                  icon={<LogoutOutlined />}
                  onClick={() => handleNavigation('/logout')}
                >
                  Logout
                </Menu.Item>
              </Menu>
            }
            placement="bottomRight"
          >
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ marginRight: '10px' }}>{username}</span>
              <Avatar src={avatarUrl} size="large" />
            </div>
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            minHeight: 280,
          }}
        >
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/addline" element={<AddLineID />} />
            <Route path="/editword" element={<EditWord />} />
            <Route path="/patient/:id" element={<PatientDetail />} />
            <Route path="/addlineform" element={<AddLineIDForm />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Sidebar;
