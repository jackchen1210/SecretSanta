
import { EventData } from '../types';

const API_BASE_URL = 'https://jsonblob.com/api/jsonBlob';
const LOCAL_PREFIX = 'local_';

// Helper to generate a random ID for local storage
const generateLocalId = () => `${LOCAL_PREFIX}${Math.random().toString(36).substring(2, 15)}`;

// Helper to handle fetch errors
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`Storage Error: ${response.statusText}`);
  }
  return response;
};

export const storageService = {
  /**
   * Creates a new event. Tries the server first, falls back to localStorage if network fails.
   */
  createEvent: async (data: EventData): Promise<string> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
        referrerPolicy: 'no-referrer',
        mode: 'cors'
      });

      await handleResponse(response);
      
      const location = response.headers.get('Location');
      if (!location) {
        throw new Error("Failed to get event ID from server");
      }
      
      const eventId = location.split('/').pop();
      if (!eventId) throw new Error("Invalid event ID format");
      
      return eventId;

    } catch (error) {
      console.warn("Server storage failed, falling back to local storage:", error);
      const localId = generateLocalId();
      localStorage.setItem(localId, JSON.stringify(data));
      return localId;
    }
  },

  /**
   * Loads event data. Handles both server IDs and local fallback IDs.
   */
  getEvent: async (eventId: string): Promise<EventData> => {
    // Check if it's a local event
    if (eventId.startsWith(LOCAL_PREFIX)) {
      const localData = localStorage.getItem(eventId);
      if (!localData) throw new Error("Local event not found");
      return JSON.parse(localData) as EventData;
    }

    // Otherwise, fetch from server
    try {
      const response = await fetch(`${API_BASE_URL}/${eventId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        referrerPolicy: 'no-referrer',
        mode: 'cors'
      });

      await handleResponse(response);
      return await response.json() as EventData;
    } catch (error) {
      // If we can't reach the server for a server ID, we can't do anything
      console.error("Failed to fetch event from server:", error);
      throw error;
    }
  },

  /**
   * Updates an existing event. Handles both server IDs and local fallback IDs.
   */
  updateEvent: async (eventId: string, data: EventData): Promise<void> => {
    if (eventId.startsWith(LOCAL_PREFIX)) {
      localStorage.setItem(eventId, JSON.stringify(data));
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
        referrerPolicy: 'no-referrer',
        mode: 'cors'
      });

      await handleResponse(response);
    } catch (error) {
      console.error("Failed to update event on server:", error);
      // We could potentially cache this locally and retry, but for now we just log it.
      throw error;
    }
  },

  /**
   * Helper to check if an ID is local
   */
  isLocal: (eventId: string | null): boolean => {
    return !!eventId && eventId.startsWith(LOCAL_PREFIX);
  }
};
