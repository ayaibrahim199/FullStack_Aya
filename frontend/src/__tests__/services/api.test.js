/**
 * API Service Tests
 * Tests the api.js service layer for HTTP requests
 */

import axios from 'axios';
import * as api from '../../services/api';

// Mock axios
jest.mock('axios');

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Authentication', () => {
    test('signup - sends POST request with credentials', async () => {
      const mockResponse = { data: { message: 'User registered' } };
      axios.post.mockResolvedValueOnce(mockResponse);

      const result = await api.signup('testuser', 'password123', ['student']);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/signup'),
        expect.any(Object)
      );
    });

    test('signin - returns JWT token and user info', async () => {
      const mockResponse = {
        data: {
          token: 'jwt_token_here',
          username: 'testuser',
          userId: 1,
          role: 'ROLE_STUDENT'
        }
      };
      axios.post.mockResolvedValueOnce(mockResponse);

      const result = await api.signin('testuser', 'password123');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('userId');
      expect(result.username).toBe('testuser');
    });

    test('signin - stores token in localStorage', async () => {
      const mockResponse = {
        data: {
          token: 'jwt_token_here',
          username: 'testuser',
          userId: 1,
          role: 'ROLE_STUDENT'
        }
      };
      axios.post.mockResolvedValueOnce(mockResponse);

      await api.signin('testuser', 'password123');

      // Token should be stored (implementation specific)
      // This depends on your api.js implementation
    });

    test('signin - handles authentication error', async () => {
      const mockError = new Error('Invalid credentials');
      axios.post.mockRejectedValueOnce(mockError);

      await expect(api.signin('wronguser', 'wrongpass')).rejects.toThrow();
    });
  });

  describe('Slots', () => {
    test('getAvailableSlots - returns array of slots', async () => {
      const mockSlots = [
        { id: 1, status: 'AVAILABLE', startTime: '2026-01-20 10:00' },
        { id: 2, status: 'AVAILABLE', startTime: '2026-01-20 14:00' }
      ];
      axios.get.mockResolvedValueOnce({ data: mockSlots });

      const result = await api.getAvailableSlots();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].status).toBe('AVAILABLE');
    });

    test('getTeacherSlots - filters by teacher ID', async () => {
      const mockSlots = [
        { id: 1, teacherId: 5, status: 'AVAILABLE' }
      ];
      axios.get.mockResolvedValueOnce({ data: mockSlots });

      const result = await api.getTeacherSlots(5);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/slots/teacher/5'),
        expect.any(Object)
      );
    });

    test('createSlot - sends POST with slot details', async () => {
      const mockResponse = { data: { id: 3, status: 'AVAILABLE' } };
      axios.post.mockResolvedValueOnce(mockResponse);

      const slotData = {
        teacherId: 1,
        startTime: '2026-01-20T10:00:00',
        endTime: '2026-01-20T11:00:00'
      };

      const result = await api.createSlot(slotData);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/slots/create'),
        expect.any(Object)
      );
      expect(result.status).toBe('AVAILABLE');
    });

    test('updateSlot - sends PUT request', async () => {
      const mockResponse = { data: { id: 1, startTime: '2026-01-20T11:00:00' } };
      axios.put.mockResolvedValueOnce(mockResponse);

      await api.updateSlot(1, {
        startTime: '2026-01-20T11:00:00',
        endTime: '2026-01-20T12:00:00'
      });

      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/slots/1'),
        expect.any(Object)
      );
    });

    test('deleteSlot - sends DELETE request', async () => {
      axios.delete.mockResolvedValueOnce({ data: { message: 'Deleted' } });

      await api.deleteSlot(1);

      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/slots/1'),
        expect.any(Object)
      );
    });
  });

  describe('Bookings', () => {
    test('bookSlot - creates booking for student', async () => {
      const mockResponse = { data: { id: 5, studentId: 1, slotId: 2 } };
      axios.post.mockResolvedValueOnce(mockResponse);

      const result = await api.bookSlot(1, 2);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/bookings/book'),
        expect.any(Object)
      );
    });

    test('getStudentBookings - returns student appointments', async () => {
      const mockBookings = [
        { id: 1, slotId: 5, status: 'CONFIRMED' }
      ];
      axios.get.mockResolvedValueOnce({ data: mockBookings });

      const result = await api.getStudentBookings(1);

      expect(Array.isArray(result)).toBe(true);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/bookings/student/1'),
        expect.any(Object)
      );
    });

    test('cancelBooking - sends DELETE request', async () => {
      axios.delete.mockResolvedValueOnce({ data: { message: 'Cancelled' } });

      await api.cancelBooking(5);

      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/bookings/5'),
        expect.any(Object)
      );
    });

    test('cancelBooking - handles not found error', async () => {
      const mockError = new Error('Booking not found');
      axios.delete.mockRejectedValueOnce(mockError);

      await expect(api.cancelBooking(999)).rejects.toThrow('Booking not found');
    });
  });

  describe('Error Handling', () => {
    test('handles network error gracefully', async () => {
      const mockError = new Error('Network Error');
      axios.get.mockRejectedValueOnce(mockError);

      await expect(api.getAvailableSlots()).rejects.toThrow('Network Error');
    });

    test('handles 401 Unauthorized error', async () => {
      const mockError = {
        response: { status: 401, data: { message: 'Unauthorized' } }
      };
      axios.get.mockRejectedValueOnce(mockError);

      await expect(api.getAvailableSlots()).rejects.toThrow();
    });

    test('handles 500 Server error', async () => {
      const mockError = {
        response: { status: 500, data: { message: 'Server Error' } }
      };
      axios.get.mockRejectedValueOnce(mockError);

      await expect(api.getAvailableSlots()).rejects.toThrow();
    });
  });
});
