import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary bắt lỗi runtime trong React tree và in ra stack trace
 * để dễ debug. Đặc biệt hữu ích cho lỗi "Cannot read property 'length' of undefined".
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('===== ErrorBoundary caught error =====');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('=======================================');
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ef4444', marginBottom: 12 }}>
            Đã xảy ra lỗi runtime
          </Text>
          <ScrollView style={{ flex: 1, backgroundColor: '#fef2f2', padding: 12, borderRadius: 8 }}>
            <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#7f1d1d' }}>
              {this.state.error.message}
            </Text>
            <Text style={{ fontFamily: 'monospace', fontSize: 11, color: '#7f1d1d', marginTop: 12 }}>
              {this.state.error.stack}
            </Text>
          </ScrollView>
          <TouchableOpacity
            onPress={this.reset}
            style={{ marginTop: 16, padding: 14, backgroundColor: '#3b82f6', borderRadius: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
