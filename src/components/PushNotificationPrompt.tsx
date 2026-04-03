import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X, Check } from 'lucide-react';

// VAPID public key - Generate with: web-push generate-vapid-keys
// Run in terminal: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';

export function PushNotificationPrompt() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if push is supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported) {
      checkSubscription();
    }
  }, []);

  // Show prompt after delay
  useEffect(() => {
    const hasInteracted = localStorage.getItem('user_interacted');
    const promptDismissed = localStorage.getItem('push_prompt_dismissed');
    const alreadySubscribed = localStorage.getItem('push_subscribed');
    
    if (!isSubscribed && 
        permission !== 'denied' && 
        !promptDismissed && 
        !alreadySubscribed &&
        hasInteracted) {
      const timer = setTimeout(() => setShowPrompt(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [isSubscribed, permission]);

  // Check current subscription status
  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      if (subscription) {
        localStorage.setItem('push_subscribed', 'true');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  // Convert base64 to Uint8Array (required for VAPID)
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Subscribe to push notifications
  const subscribe = async () => {
    if (!isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }

    setLoading(true);

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        console.warn('Notification permission denied');
        setLoading(false);
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      
      setIsSubscribed(true);
      localStorage.setItem('push_subscribed', 'true');
      setShowPrompt(false);
      
      // Send subscription to your backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      
      // Track successful subscription
      if (window.gtag) {
        window.gtag('event', 'push_subscribed', { event_category: 'engagement' });
      }
      
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    setLoading(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify backend
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        
        setIsSubscribed(false);
        localStorage.removeItem('push_subscribed');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dismiss prompt permanently
  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('push_prompt_dismissed', 'true');
  };

  // Don't show if not supported, already subscribed, or dismissed
  if (!isSupported || isSubscribed || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-primary h-1" />
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-sm">Never Miss Breaking News</h4>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                Get instant notifications for exclusive scoops, political updates, and trending gossip.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={subscribe}
                  disabled={loading}
                  className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Bell className="w-3.5 h-3.5" />
                  )}
                  {loading ? 'Please wait...' : 'Yes, Notify Me'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
                >
                  No thanks
                </button>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}