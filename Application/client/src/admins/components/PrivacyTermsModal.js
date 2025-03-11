import React from 'react';
import { Modal, Card, Button } from 'antd';

const PrivacyTermsModal = ({ isOpen, type, onClose }) => {
  return (
    <Modal 
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button
          key="close"
          type="primary"
          size="large"
          onClick={onClose}
          className="!bg-blue-600 !text-white !font-semibold !rounded-md !shadow-md hover:!bg-blue-700 transition duration-300"
          style={{ marginBottom: '10px' }} // ปรับตำแหน่งปุ่มให้ห่างจากขอบล่าง
        >
          ยอมรับและปิด / Accept & Close
        </Button>
      ]}
      width={720} 
      centered
      className="privacy-terms-modal"
      bodyStyle={{ 
        padding: '24px',
        maxHeight: 'calc(100vh - 180px)', // จำกัดความสูงของ Modal
        overflow: 'hidden' // ป้องกันการซ้อนทับของ scrollbar
      }}
    >
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
          {type === 'privacy' ? 'นโยบายความเป็นส่วนตัว / Privacy Policy' : 'ข้อกำหนดและเงื่อนไข / Terms & Conditions'}
        </h2>
      </div>

      <div className="px-1">
        <Card 
          className="shadow-md border rounded-md"
          style={{ 
            maxHeight: '60vh', // จำกัดความสูงของเนื้อหา
            overflowY: 'auto', // ทำให้ Scrollbar ปรากฏเฉพาะที่เนื้อหา
            paddingBottom: '20px' // เพิ่ม padding กัน Scrollbar ทับปุ่ม
          }}
        >
          <div className="space-y-4">
            {type === 'privacy' ? (
              <>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">การเก็บรวบรวมข้อมูลและการใช้ข้อมูล / Data Collection & Usage</h3>
                <p className="text-gray-700">
                  GazeTalk เก็บรวบรวมและใช้ข้อมูลเพื่อการให้บริการที่มีประสิทธิภาพ:
                  <br />
                  GazeTalk collects and utilizes data to provide efficient services:
                </p>

                <h4 className="text-base sm:text-lg font-medium text-gray-800">📌 การเก็บรวบรวมข้อมูล / Data Collection</h4>
                <ul className="text-gray-700 list-disc pl-6 space-y-2">
                  <li>ข้อมูลส่วนบุคคล: ชื่อ อายุ เพศ และประวัติการรักษา <br/> Personal Data: Name, Age, Gender, and Medical History</li>
                  <li>ข้อมูลการใช้งาน: รูปแบบการเคลื่อนไหวของดวงตา คำและวลีที่ใช้บ่อย <br/> Usage Data: Eye movement patterns, frequently used words & phrases</li>
                  <li>ภาพจากกล้อง: เฉพาะในขณะใช้งานระบบติดตามดวงตา <br/> Camera Data: Only when using the eye-tracking system</li>
                </ul>

                <h4 className="text-base sm:text-lg font-medium text-gray-800">📊 การใช้ข้อมูล / Data Usage</h4>
                <ul className="text-gray-700 list-disc pl-6 space-y-2">
                  <li>พัฒนาความแม่นยำในการติดตามดวงตา <br/> Improving eye-tracking accuracy</li>
                  <li>ปรับแต่งคำแนะนำให้เหมาะสมกับผู้ใช้แต่ละคน <br/> Personalizing recommendations for each user</li>
                  <li>วิเคราะห์และปรับปรุงประสิทธิภาพของระบบ <br/> Analyzing & enhancing system efficiency</li>
                </ul>

                <h4 className="text-base sm:text-lg font-medium text-gray-800">🔐 การรักษาความปลอดภัย / Data Security</h4>
                <ul className="text-gray-700 list-disc pl-6 space-y-2">
                  <li>การเข้ารหัสข้อมูลทั้งหมด <br/> Encrypting all data</li>
                  <li>การจำกัดการเข้าถึงข้อมูลเฉพาะผู้ที่ได้รับอนุญาต <br/> Restricting data access to authorized personnel only</li>
                  <li>การสำรองข้อมูลอย่างสม่ำเสมอ <br/> Regularly backing up data</li>
                </ul>
              </>
            ) : (
              <>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">การยอมรับเงื่อนไขและข้อจำกัดความรับผิดชอบ / Terms & Disclaimer</h3>
                <p className="text-gray-700">
                  การใช้งาน GazeTalk ถือว่าคุณได้อ่านและยอมรับเงื่อนไขทั้งหมดแล้ว:
                  <br />
                  By using GazeTalk, you acknowledge and agree to the following terms:
                </p>

                <h4 className="text-base sm:text-lg font-medium text-gray-800">✅ การยอมรับเงื่อนไข / Terms Acceptance</h4>
                <ul className="text-gray-700 list-disc pl-6 space-y-2">
                  <li>ใช้งานระบบตามวัตถุประสงค์ที่กำหนดเท่านั้น <br/> Use the system only for its intended purpose</li>
                  <li>ไม่ละเมิดสิทธิ์ของผู้อื่นในการใช้งานระบบ <br/> Do not infringe on others' rights while using the system</li>
                  <li>รักษาความลับของข้อมูลการเข้าถึงระบบ <br/> Keep your access data confidential</li>
                </ul>

                <h4 className="text-base sm:text-lg font-medium text-gray-800">⚠️ ข้อจำกัดความรับผิดชอบ / Disclaimer</h4>
                <ul className="text-gray-700 list-disc pl-6 space-y-2">
                  <li>ไม่ใช่อุปกรณ์ทางการแพทย์ที่ได้รับการรับรอง <br/> Is not a certified medical device</li>
                  <li>ไม่สามารถทดแทนการรักษาหรือคำแนะนำจากแพทย์ <br/> Cannot replace medical advice or treatment</li>
                  <li>อาจมีข้อผิดพลาดในการทำงานได้ <br/> May have operational inaccuracies</li>
                </ul>

                <h4 className="text-base sm:text-lg font-medium text-gray-800">🛠️ การปรับปรุงเงื่อนไข / Terms Updates</h4>
                <ul className="text-gray-700 list-disc pl-6 space-y-2">
                  <li>จะแจ้งให้ผู้ใช้ทราบล่วงหน้าอย่างน้อย 30 วัน <br/> Users will be notified at least 30 days in advance</li>
                  <li>การใช้งานต่อหลังการปรับปรุงถือว่ายอมรับเงื่อนไขใหม่ <br/> Continuing to use the service after updates implies acceptance of the new terms</li>
                </ul>
              </>
            )}

          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default PrivacyTermsModal;