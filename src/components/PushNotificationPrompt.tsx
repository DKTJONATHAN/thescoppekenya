import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export function PushNotificationPrompt() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      if (Notification.permission === 'granted') {
        setIsSubscribed(true);
        localStorage.setItem('push_subscribed', 'true');
      }
    }
  }, []);

  useEffect(() => {
    const promptDismissed = localStorage.getItem('push_prompt_dismissed');
    const alreadySubscribed = localStorage.getItem('push_subscribed');

    if (!isSubscribed && permission !== 'denied' && !promptDismissed && !alreadySubscribed) {
      const timer = setTimeout(() => setShowPrompt(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [isSubscribed, permission]);

  const subscribe = async () => {
    if (!isSupported) return;
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        setIsSubscribed(true);
        localStorage.setItem('push_subscribed', 'true');
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('push_prompt_dismissed', 'true');
  };

  if (!isSupported || isSubscribed || !showPrompt) return null;

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
