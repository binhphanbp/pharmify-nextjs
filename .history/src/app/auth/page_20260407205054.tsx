'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/stores';
import { signIn, signUp } from '@/stores/auth-store';

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <span className="material-icons text-4xl text-primary animate-spin">
            sync
          </span>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (user) router.push(redirect);
  }, [user, redirect, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await dispatch(
        signIn({ email: loginEmail, password: loginPassword }),
      ).unwrap();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (regPassword !== regConfirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (regPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      await dispatch(
        signUp({ email: regEmail, password: regPassword, fullName: regName }),
      ).unwrap();
      setSuccess('Đăng ký thành công! Kiểm tra email để xác nhận tài khoản.');
      setTab('login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-icons text-4xl text-primary">
              local_pharmacy
            </span>
            <span className="text-2xl font-bold text-primary">Pharmify</span>
          </div>
          <p className="text-text-secondary text-sm">
            Đăng nhập để mua sắm và theo dõi đơn hàng
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {/* Tabs */}
          <div className="flex gap-1 bg-bg-primary rounded-lg p-1 mb-6">
            <button
              onClick={() => {
                setTab('login');
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition ${tab === 'login' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary'}`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => {
                setTab('register');
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition ${tab === 'register' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary'}`}
            >
              Đăng ký
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-danger text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
              <span className="material-icons text-lg">error</span>
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-success text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
              <span className="material-icons text-lg">check_circle</span>
              {success}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center mt-2"
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Họ tên</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center mt-2"
              >
                {loading ? 'Đang xử lý...' : 'Đăng ký'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
