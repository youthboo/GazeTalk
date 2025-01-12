import React, { useState, useEffect } from 'react';
import { Table, Modal, Input, Button, message, Select, Card, Row, Col, Typography, Empty, Spin, Tooltip } from 'antd';
import {  EditOutlined, FilterOutlined } from '@ant-design/icons';
import './EditWord.css';

const { Title, Text } = Typography;
const { Option } = Select;

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

  const fetchData = async () => {
    if (!gender || !ageRange) {
      setSummary([]);
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [messagesResponse, summaryResponse] = await Promise.all([
        fetch(`http://localhost:3008/api/words?gender=${gender}&ageRange=${ageRange}`),
        fetch(`http://localhost:3008/api/messages/messages?gender=${gender}&ageRange=${ageRange}`)
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

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [gender, ageRange]);

  const handleAddNewWord = async () => {
    if (!newWord.trim()) {
      message.warning('กรุณากรอกคำใหม่');
      return;
    }

    try {
      const response = await fetch('http://localhost:3008/api/words/update', {
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

  const openAddModal = (word) => {
    setSelectedWord(word);
    setIsModalOpen(true);
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
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
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
              <Col xs={24} sm={12}>
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
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="สรุปข้อมูลการใช้คำ">
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
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`
                }}
                locale={{
                  emptyText: 'ไม่มีข้อมูล'
                }}
              />

            )}
          </Card>
        </Col>

        <Col span={24}>
          <Card title="เพิ่มคำศัพท์ใหม่">
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
              <Empty description="ไม่พบคำศัพท์สำหรับช่วงอายุและเพศที่เลือก" />
            ) : (
              <Row gutter={[16, 16]}>
                {messages.map((word, index) => (
                <Col xs={24} sm={8} key={index}>
                  <Button 
                    onClick={() => openAddModal(word)} 
                    className="edit-word-new-word-btn"
                    block
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span>{word}</span>
                    <Tooltip title="แก้ไขคำ">
                      <EditOutlined />
                    </Tooltip>
                  </Button>
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
    </div>
  );
};

export default EditWord;
