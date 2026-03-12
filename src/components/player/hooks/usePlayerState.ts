'use client';

import { useReducer, useCallback } from 'react';
import { PlayerState, PlayerAction } from '../types/player';

const initialState: PlayerState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,
  quality: '1080p',
  isFullscreen: false,
  isLoading: true,
  error: null,
};

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_BUFFERED':
      return { ...state, buffered: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload, isMuted: action.payload === 0 };
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted };
    case 'SET_PLAYBACK_RATE':
      return { ...state, playbackRate: action.payload };
    case 'SET_QUALITY':
      return { ...state, quality: action.payload };
    case 'SET_FULLSCREEN':
      return { ...state, isFullscreen: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function usePlayerState() {
  const [state, dispatch] = useReducer(playerReducer, initialState);

  const actions = {
    setPlaying: useCallback((playing: boolean) => dispatch({ type: 'SET_PLAYING', payload: playing }), []),
    togglePlay: useCallback(() => dispatch({ type: 'TOGGLE_PLAY' }), []),
    setCurrentTime: useCallback((time: number) => dispatch({ type: 'SET_CURRENT_TIME', payload: time }), []),
    setDuration: useCallback((duration: number) => dispatch({ type: 'SET_DURATION', payload: duration }), []),
    setBuffered: useCallback((buffered: number) => dispatch({ type: 'SET_BUFFERED', payload: buffered }), []),
    setVolume: useCallback((volume: number) => dispatch({ type: 'SET_VOLUME', payload: volume }), []),
    toggleMute: useCallback(() => dispatch({ type: 'TOGGLE_MUTE' }), []),
    setPlaybackRate: useCallback((rate: number) => dispatch({ type: 'SET_PLAYBACK_RATE', payload: rate }), []),
    setQuality: useCallback((quality: string) => dispatch({ type: 'SET_QUALITY', payload: quality }), []),
    setFullscreen: useCallback((fs: boolean) => dispatch({ type: 'SET_FULLSCREEN', payload: fs }), []),
    setLoading: useCallback((loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }), []),
    setError: useCallback((error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }), []),
    reset: useCallback(() => dispatch({ type: 'RESET' }), []),
  };

  return { state, dispatch, actions };
}
