import { message, notification } from 'antd';

// Custom style configurations to match EventHub 360 primary branding colors
export const showToast = {
  success: (msg: string) => {
    message.success({
      content: msg,
      style: {
        marginTop: '20px',
      },
    });
  },
  error: (msg: string) => {
    message.error({
      content: msg,
      style: {
        marginTop: '20px',
      },
    });
  },
  warning: (msg: string) => {
    message.warning({
      content: msg,
      style: {
        marginTop: '20px',
      },
    });
  },
  info: (msg: string) => {
    message.info({
      content: msg,
      style: {
        marginTop: '20px',
      },
    });
  },
  // Real-time alert notifications (drawer alerts)
  pushAlert: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error' = 'warning') => {
    notification[type]({
      message: title,
      description: desc,
      placement: 'bottomRight',
      duration: 5,
    });
  }
};
