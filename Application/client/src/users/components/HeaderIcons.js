import React, { useState, useEffect } from "react";
import { Modal, Steps, Button, Typography } from "antd";
import { FaQuestionCircle, FaSignOutAlt, FaVolumeUp, FaVolumeMute, FaPauseCircle, FaPlayCircle } from "react-icons/fa";
import leftRightGif from '../assets/left-right.gif';
import centerGif from '../assets/center.gif';
import selectGif from '../assets/select.gif';
import Swal from "sweetalert2";

const { Title, Paragraph } = Typography;

export const GuideIcon = ({ autoOpen = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  // ตรวจสอบว่า modal แสดงไปแล้วหรือยัง
  useEffect(() => {
    const hasShownModal = localStorage.getItem("hasShownModal");
    
    if (!hasShownModal) {
      setIsModalOpen(true);  
      setCurrent(0);
      localStorage.setItem("hasShownModal", "true"); 
    }
  }, []);

  const showModal = () => {
    setIsModalOpen(true);
    setCurrent(0);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const steps = [
    {
      title: 'ขั้นตอนที่ 1',
      description: 'การมองซ้าย-ขวา: มองซ้ายหรือขวาเพื่อเลื่อนไฮไลท์ไปยังทิศทางที่ต้องการ',
      content: (
        <div>
          <Paragraph style={{ fontSize: 18 }}>
            <strong>การมองซ้าย-ขวา:</strong> มองซ้ายหรือขวาเพื่อเลื่อนไฮไลท์ไปยังทิศทางที่ต้องการ
          </Paragraph>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <img 
              src={leftRightGif} 
              alt="การมองซ้าย-ขวา" 
              style={{ maxWidth: '80%', borderRadius: 8 }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'ขั้นตอนที่ 2',
      description: 'การมองตรงกลางหน้าจอ: มองที่ตรงกลางหน้าจอเพื่อหยุดการเลื่อนของไฮไลท์',
      content: (
        <div>
          <Paragraph style={{ fontSize: 18 }}>
            <strong>การมองตรงกลางหน้าจอ:</strong> เมื่อคุณต้องการหยุดการเลื่อนของไฮไลท์
            ให้มองที่ตรงกลางหน้าจอหรือกล้องที่แสดงตรงกลางเพื่อหยุดการเลื่อนของไฮไลท์
            ระบบจะหยุดการเลื่อนและรอให้คุณทำการเลือก
          </Paragraph>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <img 
              src={centerGif} 
              alt="การมองตรงกลางหน้าจอ" 
              style={{ maxWidth: '80%', borderRadius: 8 }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'ขั้นตอนที่ 3',
      description: 'การหลับตาค้าง: หลับตาค้างเพื่อยืนยันการเลือก',
      content: (
        <div>
          <Paragraph style={{ fontSize: 18 }}>
            <strong>หลับตาค้าง:</strong> หลับตาค้างเพื่อยืนยันการเลือก เมื่อคุณต้องการเลือกรายการที่ไฮไลท์อยู่ 
            ให้หลับตาค้างไว้จนกว่าจะได้ยินเสียงเพื่อยืนยันการเลือก ระบบจะนับถอยหลังและดำเนินการเลือกปุ่มนัั้นเมื่อครบกำหนดเวลา
          </Paragraph>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <img 
              src={selectGif} 
              alt="การหลับตาค้าง" 
              style={{ maxWidth: '80%', borderRadius: 8 }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'ขั้นตอนที่ 4',
      description: 'วิดีโอสาธิตการใช้งาน: หลับตาค้างเพื่อยืนยันการเลือก',
      content: (
        <div>
          <div style={{ marginTop: 24 }}>
            <Title level={4} style={{ marginBottom: 16 }}>วิดีโอสาธิตการใช้งาน</Title>
            <iframe 
              width="100%" 
              height="390" 
              src="https://www.youtube.com/embed/2a_56pznSKw"
              title="คู่มือการใช้งาน" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          </div>
        </div>
      ),
    },
  ];

  const contentStyle = {
    lineHeight: '1.6',
    padding: '24px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #f0f0f0',
    marginTop: 24,
    minHeight: '300px',
  };

  return (
    <>
      <button className="icon-button" onClick={showModal}>
        <FaQuestionCircle size={24} />
      </button>

      <Modal
        title={<Title level={3} style={{ textAlign: 'center', margin: 0 }}>คู่มือการใช้งาน</Title>}
        open={isModalOpen}
        onCancel={handleCancel}
        width={900}
        centered
        footer={[
          <div key="footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              {current > 0 && (
                <Button size="large" onClick={prev} style={{ marginRight: 8 }}>
                  ย้อนกลับ
                </Button>
              )}
            </div>
            <div>
              {current < steps.length - 1 && (
                <Button type="primary" size="large" onClick={next}>
                  ถัดไป
                </Button>
              )}
              {current === steps.length - 1 && (
                <Button type="primary" size="large" onClick={handleCancel}>
                  เสร็จสิ้น
                </Button>
              )}
            </div>
          </div>
        ]}
        styles={{ body: { padding: '24px 32px' } }}
      >
        <div className="guide-content">
          <Steps 
            current={current} 
            items={steps.map(item => ({ key: item.title, title: item.title }))}
            style={{ marginBottom: 20 }}
          />
          
          <div style={contentStyle}>
            {steps[current].content}
          </div>
        </div>
      </Modal>
    </>
  );
};

export const LogoutIcon = ({ onLogout }) => {
  const handleLogout = () => {
    Swal.fire({
      title: "คุณต้องการออกจากระบบหรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        if (onLogout) onLogout();
        window.location.href = "/login";
      }
    });
  };

  return (
    <button className="icon-button" onClick={handleLogout}>
      <FaSignOutAlt size={24} />
    </button>
  );
};

export const VolumeControlIcon = ({ isMuted, toggleVolume }) => {
  return (
    <button className="icon-button" onClick={toggleVolume}>
      {isMuted ? <FaVolumeMute size={24} /> : <FaVolumeUp size={24} />}
    </button>
  );
};

export const PauseHighlightIcon = ({ isPaused, togglePause }) => {
  return (
    <button className="icon-button" onClick={togglePause}>
      {isPaused ? <FaPlayCircle size={24} /> : <FaPauseCircle size={24} />}
    </button>
  );
};