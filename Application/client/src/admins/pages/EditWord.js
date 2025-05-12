import React, { useState, useEffect } from 'react';
import { Table, Modal, Input, Button, message, Select, Card, Row, Col, Typography, Empty, Spin, Tooltip, DatePicker } from 'antd';
import { EditOutlined, FilterOutlined, DeleteOutlined, CalendarOutlined, SwapOutlined, SelectOutlined } from '@ant-design/icons';
import './EditWord.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const EditWord = () => {
  const [gender, setGender] = useState(undefined);
  const [ageRange, setAgeRange] = useState(undefined);
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [newWord, setNewWord] = useState('');
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [selectedTableWord, setSelectedTableWord] = useState(null);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [wordToReplace, setWordToReplace] = useState('');

  const fetchData = async () => {
    if (!gender || !ageRange) {
      setSummary([]);
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // สร้าง URL พื้นฐาน
      let messagesUrl = `${process.env.REACT_APP_GAZETALK_URL}/api/words?gender=${gender}&ageRange=${ageRange}`;
      let summaryUrl = `${process.env.REACT_APP_GAZETALK_URL}/api/messages/messages?gender=${gender}&ageRange=${ageRange}`;
      
      // เพิ่มพารามิเตอร์วันที่ถ้ามีการเลือก
      if (dateRange && dateRange.length === 2) {
        const startDate = dateRange[0].format('YYYY-MM-DD');
        const endDate = dateRange[1].format('YYYY-MM-DD');
        messagesUrl += `&startDate=${startDate}&endDate=${endDate}`;
        summaryUrl += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const [messagesResponse, summaryResponse] = await Promise.all([
        fetch(messagesUrl),
        fetch(summaryUrl)
      ]);

      const messagesData = await messagesResponse.json();
      const summaryData = await summaryResponse.json();

      setMessages(messagesData.words || []);
      setSummary(summaryData.summary || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
      setError('ไม่สามารถโหลดข้อมูลได้');
      setSummary([]);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // ผูกการดึงข้อมูลกับการเปลี่ยนแปลงของตัวกรอง
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [gender, ageRange]);

  // ฟังก์ชันสำหรับการค้นหาด้วยช่วงวันที่
  const handleSearch = () => {
    fetchData();
  };

  const handleAddNewWord = async () => {
    if (!newWord.trim()) {
      message.warning('กรุณากรอกคำใหม่');
      return;
    }
  
    // ตรวจสอบว่าคำที่กรอกมีอยู่แล้วหรือไม่
    if (messages.includes(newWord.trim())) {
      message.warning('คำนี้มีอยู่แล้วในระบบ');
      return;
    }
  
    try {
      const response = await fetch(`${process.env.REACT_APP_GAZETALK_URL}/api/words/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gender,
          ageRange,
          oldWord: selectedWord,
          newWord,
        }),
      });
  
      if (response.ok) {
        message.success('เพิ่มคำสำเร็จ');
        fetchData();
        setIsModalOpen(false);
        setNewWord('');
      } else {
        const errorData = await response.json();
        message.error(`เกิดข้อผิดพลาด: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error adding new word:', error.message);
      message.error('ไม่สามารถเพิ่มคำได้');
    }
  };

  const handleReplaceWord = async () => {
    if (!selectedTableWord) {
      message.warning('กรุณาเลือกคำจากตารางก่อน');
      return;
    }
  
    try {
      const response = await fetch(`${process.env.REACT_APP_GAZETALK_URL}/api/words/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gender,
          ageRange,
          oldWord: wordToReplace,
          newWord: selectedTableWord,
        }),
      });
  
      if (response.ok) {
        message.success(`แทนที่ "${wordToReplace}" ด้วย "${selectedTableWord}" สำเร็จ`);
        fetchData();
        setIsReplaceModalOpen(false);
        setWordToReplace('');
      } else {
        const errorData = await response.json();
        message.error(`เกิดข้อผิดพลาด: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error replacing word:', error.message);
      message.error('ไม่สามารถแทนที่คำได้');
    }
  };
  
  const handleDeleteMessage = (word) => {
    Modal.confirm({
      title: 'คุณแน่ใจหรือไม่ที่จะลบข้อความนี้?',
      content: (
        <p>คำว่า "{word}" จะถูกลบออกจากระบบ</p>
      ),
      okText: 'ลบ',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          const url = `${process.env.REACT_APP_GAZETALK_URL}/api/messages/messages?gender=${gender}&ageRange=${ageRange}&word=${word}`;
          
          const response = await fetch(url, {
            method: 'DELETE',
          });
  
          if (response.ok) {
            message.success('ข้อความถูกลบเรียบร้อยแล้ว');
            fetchData(); 
          } else {
            const errorData = await response.json();
            message.error(`เกิดข้อผิดพลาด: ${errorData.message}`);
          }
        } catch (error) {
          console.error('Error deleting message:', error.message);
          message.error('ไม่สามารถลบข้อความได้');
        }
      },
    });
  };  

  const openAddModal = (word) => {
    setSelectedWord(word);
    setIsModalOpen(true);
  };

  const openReplaceModal = (word) => {
    setWordToReplace(word);
    setIsReplaceModalOpen(true);
  };

  const columns = [
    {
      title: 'คำ',
      dataIndex: 'word',
      key: 'word',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'จำนวนการใช้',
      dataIndex: 'usage_count',
      key: 'usage_count',
      render: (count) => <Text type="secondary">{count}</Text>,
    },
    {
      title: 'การจัดการ',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="primary"
            icon={<SelectOutlined />}
            onClick={() => setSelectedTableWord(record.word)}
            disabled={selectedTableWord === record.word}
          >
            {selectedTableWord === record.word ? 'เลือกแล้ว' : 'เลือก'}
          </Button>
          <Button
            type="danger"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteMessage(record.word)}
          >
            ลบ
          </Button>
        </div>
      ),
    },
  ];

  const data = summary.map(({ word, usage_count }, index) => ({
    key: index,
    word,
    usage_count,
  }));

  return (
    <div className="edit-word-container">
      <Row gutter={[16, 16]} justify="center">
        <Col span={24}>
        <Card 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={3} style={{ margin: 0 }}>
                <FilterOutlined style={{ marginRight: 8 }} />
                จัดการคำศัพท์
              </Title>
            </div>
          }
        >
          {/* แถวตัวกรองหลัก */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <div className="edit-word-form-group">
                <Text strong>ช่วงอายุ:</Text>
                <Select
                  value={ageRange || undefined}
                  onChange={(value) => setAgeRange(value)}
                  style={{ width: '100%' }}
                  placeholder="เลือกช่วงอายุ"
                  size="large"
                >
                  <Option value="13-19">13-19</Option>
                  <Option value="20-39">20-39</Option>
                  <Option value="40-59">40-59</Option>
                  <Option value="60-120">60 ขึ้นไป</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="edit-word-form-group">
                <Text strong>เพศ:</Text>
                <Select
                  value={gender || undefined}
                  onChange={(value) => setGender(value)}
                  style={{ width: '100%' }}
                  placeholder="เลือกเพศ"
                  size="large"
                >
                  <Option value="male">ชาย</Option>
                  <Option value="female">หญิง</Option>
                  <Option value="other">อื่นๆ</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <div className="edit-word-form-group">
                <Text strong>ค้นหาตามช่วงเวลา <span style={{ fontWeight: 'normal', color: '#999' }}></span>:</Text>
                <RangePicker
                  style={{ width: '100%' }}
                  onChange={setDateRange}
                  placeholder={['วันที่เริ่มต้น', 'วันที่สิ้นสุด']}
                  size="large"
                  format="DD/MM/YYYY"
                />
              </div>
            </Col>
            <Col xs={24} sm={24} md={4} style={{ display: 'flex', alignItems: 'end' }}>
              <Button 
                type="primary" 
                icon={<CalendarOutlined />}
                onClick={handleSearch}
                size="large"
                style={{ width: '100%' }}
              >
                ค้นหา
              </Button>
            </Col>
          </Row>
        </Card>

        </Col>

        <Col span={24}>
          <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>สรุปข้อมูลการใช้คำ</span>
                  {selectedTableWord && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Text type="success" strong style={{ marginRight: '7px' }}>
                        คำที่เลือก: {selectedTableWord}
                      </Text>
                      <Button 
                        type="text" 
                        danger 
                        size="small"
                        onClick={() => setSelectedTableWord(null)}
                        style={{ border: '1px solid #ff4d4f' }}
                      >
                        ยกเลิกการเลือก
                      </Button>
                    </div>
                  )}
                </div>
              }
            >

            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" />
              </div>
            ) : error ? (
              <Empty 
                description={error} 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table
                className="custom-table"
                columns={columns}
                dataSource={data}
                pagination={{
                  pageSize: 5,
                  simple: false, 
                  showSizeChanger: false,
                  showQuickJumper: false, 
                }}
                locale={{
                  emptyText: dateRange && dateRange.length === 2 
                    ? `ไม่พบข้อมูลในช่วงวันที่ ${dateRange[0].format('DD/MM/YYYY')} ถึง ${dateRange[1].format('DD/MM/YYYY')}` 
                    : 'ไม่มีข้อมูล'
                }}
              />
            )}
          </Card>
        </Col>

        <Col span={24}>
          <Card title="แก้ไขคำศัพท์">
            {!gender || !ageRange ? (
              <Empty 
                description="กรุณาเลือกช่วงอายุและเพศก่อน" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" />
              </div>
            ) : messages.length === 0 ? (
              <Empty 
                description={dateRange && dateRange.length === 2 
                  ? `ไม่พบคำศัพท์ในช่วงวันที่ ${dateRange[0].format('DD/MM/YYYY')} ถึง ${dateRange[1].format('DD/MM/YYYY')}` 
                  : "ไม่พบคำศัพท์สำหรับช่วงอายุและเพศที่เลือก"} 
              />
            ) : (
              <Row gutter={[16, 16]}>
                {messages.map((word, index) => (
                <Col xs={24} sm={8} key={index}>
                  <div className="word-card">
                    <div className="word-text">{word}</div>
                    <div className="word-actions">
                      <Tooltip title="แก้ไขคำ">
                        <Button 
                          type="primary" 
                          icon={<EditOutlined />} 
                          onClick={() => openAddModal(word)}
                        />
                      </Tooltip>
                      <Tooltip title="แทนที่ด้วยคำที่เลือก">
                        <Button 
                          type="default" 
                          icon={<SwapOutlined />} 
                          onClick={() => openReplaceModal(word)}
                          disabled={!selectedTableWord}
                        />
                      </Tooltip>
                      
                    </div>
                  </div>
                </Col>
              ))}
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={`เพิ่มคำใหม่แทน "${selectedWord}"`}
        open={isModalOpen}
        onOk={handleAddNewWord}
        onCancel={() => setIsModalOpen(false)}
        okText="เพิ่ม"
        cancelText="ยกเลิก"
      >
        <Input
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          placeholder="กรอกคำใหม่"
          size="large"
        />
      </Modal>

      <Modal
        title={`แทนที่คำด้วยคำที่เลือก`}
        open={isReplaceModalOpen}
        onOk={handleReplaceWord}
        onCancel={() => setIsReplaceModalOpen(false)}
        okText="แทนที่"
        cancelText="ยกเลิก"
      >
        <div style={{ marginBottom: 16 }}>
          <Text>คำเดิม: <Text strong>{wordToReplace}</Text></Text>
        </div>
        <div>
          <Text>คำใหม่: <Text strong type="success">{selectedTableWord || '(กรุณาเลือกคำจากตาราง)'}</Text></Text>
        </div>
      </Modal>

    </div>
  );
};

export default EditWord;