import { BaseToast } from 'react-native-toast-message';

export const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#148f8f', backgroundColor: '#f9f9f9' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter',
        color: '#333',
      }}
      text2Style={{
        fontSize: 12,
        fontFamily: 'Inter',
        color: '#666',
      }}
    />
  ),
};
