import React, { useState } from 'react';
import { Form, Button, Card, Space, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import NumberRange from './index';

const NumberRangeDemo = () => {
  const [form] = Form.useForm();
  const [controlledValue, setControlledValue] = useState<{ min?: number; max?: number }>({ min: 1, max: 5 });
  const { t, i18n } = useTranslation();

  const onFinish = (values: any) => {
    console.log('Form values:', values);
  };

  const resetForm = () => {
    form.resetFields();
    setControlledValue({ min: 1, max: 5 });
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>NumberRange 组件演示</h1>
        <Select
          value={i18n.language}
          onChange={changeLanguage}
          style={{ width: 120 }}
          options={[
            { label: '中文', value: 'zh-CN' },
            { label: 'English', value: 'en-US' }
          ]}
        />
      </div>
      
      <Card title="基础用法" style={{ marginBottom: 16 }}>
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item 
            name="experience" 
            label="工作经验"
            rules={[{ required: true, message: '请选择工作经验范围' }]}
          >
            <NumberRange 
              suffix="years"
            />
          </Form.Item>
          
          <Form.Item 
            name="salary" 
            label="薪资范围"
            rules={[{ required: true, message: '请选择薪资范围' }]}
          >
            <NumberRange 
              suffix="k"
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={resetForm}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="受控组件" style={{ marginBottom: 16 }}>
        <div>
          <p>当前值: {JSON.stringify(controlledValue)}</p>
          <NumberRange 
            value={controlledValue}
            onChange={setControlledValue}
            suffix="months"
          />
        </div>
      </Card>

      <Card title="不同后缀示例">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>工作经验：</label>
            <NumberRange suffix="years" />
          </div>
          
          <div>
            <label>薪资范围：</label>
            <NumberRange suffix="k" />
          </div>
          
          <div>
            <label>年龄范围：</label>
            <NumberRange suffix="岁" />
          </div>
        </Space>
      </Card>

      <Card title="国际化说明">
        <p>当前语言: {i18n.language === 'zh-CN' ? '中文' : 'English'}</p>
        <p>最小值和最大值的占位符文本会根据语言自动切换：</p>
        <ul>
          <li>中文: {t('numberRange.min')}, {t('numberRange.max')}</li>
          <li>English: {t('numberRange.min')}, {t('numberRange.max')}</li>
        </ul>
      </Card>
    </div>
  );
};

export default NumberRangeDemo; 