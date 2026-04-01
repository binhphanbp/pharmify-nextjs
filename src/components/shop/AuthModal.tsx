'use client';

import { useState } from 'react';
import { useAppDispatch } from '@/stores';
import { signIn, signUp, resetPassword } from '@/stores/auth-store';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

interface AuthModalProps {
  onClose: () => void;
}

type Tab = 'login' | 'register' | 'forgot';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  password: Yup.string().required('Vui lòng nhập mật khẩu'),
});

const RegisterSchema = Yup.object().shape({
  fullName: Yup.string().required('Vui lòng nhập họ tên'),
  email: Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  password: Yup.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').required('Vui lòng nhập mật khẩu'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng nhập lại mật khẩu'),
});

const ForgotSchema = Yup.object().shape({
  email: Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
});

export default function AuthModal({ onClose }: AuthModalProps) {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<Tab>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal max-w-md">
        <div className="modal-header">
          <h3>
            {tab === 'login' && 'Đăng nhập'}
            {tab === 'register' && 'Đăng ký'}
            {tab === 'forgot' && 'Quên mật khẩu'}
          </h3>
          <button className="btn-close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="modal-body">
          {/* Tabs */}
          {tab !== 'forgot' && (
            <div className="flex gap-1 bg-bg-primary rounded-lg p-1 mb-6">
              <button
                onClick={() => {
                  setTab('login');
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition ${tab === 'login' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => {
                  setTab('register');
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition ${tab === 'register' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Đăng ký
              </button>
            </div>
          )}

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

          {/* Login Form */}
          {tab === 'login' && (
            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={LoginSchema}
              onSubmit={async (values, { setSubmitting }) => {
                setError('');
                try {
                  const result = await dispatch(
                    signIn({ email: values.email, password: values.password }),
                  ).unwrap();
                  if (result === undefined) onClose();
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : String(err));
                }
                setSubmitting(false);
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="form-group pb-2">
                    <label>Email</label>
                    <Field
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      className="w-full border rounded-md p-2 mt-1"
                    />
                    <ErrorMessage name="email" component="div" className="text-danger text-xs mt-1" />
                  </div>
                  <div className="form-group pb-2">
                    <label>Mật khẩu</label>
                    <Field
                      name="password"
                      type="password"
                      placeholder="••••••"
                      className="w-full border rounded-md p-2 mt-1"
                    />
                    <ErrorMessage name="password" component="div" className="text-danger text-xs mt-1" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-sm text-primary hover:underline mb-4 block mt-2"
                  >
                    Quên mật khẩu?
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full justify-center"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
                  </button>
                </Form>
              )}
            </Formik>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <Formik
              initialValues={{ fullName: '', email: '', password: '', confirmPassword: '' }}
              validationSchema={RegisterSchema}
              onSubmit={async (values, { setSubmitting }) => {
                setError('');
                setSuccess('');
                try {
                  await dispatch(
                    signUp({ email: values.email, password: values.password, fullName: values.fullName }),
                  ).unwrap();
                  setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.');
                  setTab('login');
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : String(err));
                }
                setSubmitting(false);
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="form-group pb-2">
                    <label>Họ tên</label>
                    <Field
                      name="fullName"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      className="w-full border rounded-md p-2 mt-1"
                    />
                    <ErrorMessage name="fullName" component="div" className="text-danger text-xs mt-1" />
                  </div>
                  <div className="form-group pb-2">
                    <label>Email</label>
                    <Field
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      className="w-full border rounded-md p-2 mt-1"
                    />
                    <ErrorMessage name="email" component="div" className="text-danger text-xs mt-1" />
                  </div>
                  <div className="form-group pb-2">
                    <label>Mật khẩu</label>
                    <Field
                      name="password"
                      type="password"
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full border rounded-md p-2 mt-1"
                    />
                    <ErrorMessage name="password" component="div" className="text-danger text-xs mt-1" />
                  </div>
                  <div className="form-group pb-2">
                    <label>Xác nhận mật khẩu</label>
                    <Field
                      name="confirmPassword"
                      type="password"
                      placeholder="Nhập lại mật khẩu"
                      className="w-full border rounded-md p-2 mt-1"
                    />
                    <ErrorMessage name="confirmPassword" component="div" className="text-danger text-xs mt-1" />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full justify-center mt-2"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
                  </button>
                </Form>
              )}
            </Formik>
          )}

          {/* Forgot Password */}
          {tab === 'forgot' && (
            <Formik
              initialValues={{ email: '' }}
              validationSchema={ForgotSchema}
              onSubmit={async (values, { setSubmitting }) => {
                setError('');
                setSuccess('');
                try {
                  await dispatch(resetPassword(values.email)).unwrap();
                  setSuccess('Đã gửi email khôi phục mật khẩu!');
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : String(err));
                }
                setSubmitting(false);
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <p className="text-sm text-text-secondary mb-4">
                    Nhập email của bạn để nhận link khôi phục mật khẩu.
                  </p>
                  <div className="form-group pb-2">
                    <label>Email</label>
                    <Field
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      className="w-full border rounded-md p-2 mt-1"
                    />
                    <ErrorMessage name="email" component="div" className="text-danger text-xs mt-1" />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full justify-center mb-3 mt-2"
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi email khôi phục'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="text-sm text-primary hover:underline w-full text-center"
                  >
                    ← Quay lại đăng nhập
                  </button>
                </Form>
              )}
            </Formik>
          )}
        </div>
      </div>
    </div>
  );
}
