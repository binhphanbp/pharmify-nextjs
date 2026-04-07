'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/stores';
import { signIn, signUp, resetPassword } from '@/stores/auth-store';
import {
  Formik,
  Form,
  Field,
  ErrorMessage,
  FormikErrors,
  FormikTouched,
} from 'formik';
import * as Yup from 'yup';

interface AuthModalProps {
  onClose: () => void;
  redirectTo?: string;
  standalone?: boolean;
}

type Tab = 'login' | 'register' | 'forgot';

// ─── YUP SCHEMAS ────────────────────────────────────────────────
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email không hợp lệ')
    .required('Vui lòng nhập email'),
  password: Yup.string().required('Vui lòng nhập mật khẩu'),
});

const RegisterSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(2, 'Họ tên tối thiểu 2 ký tự')
    .required('Vui lòng nhập họ tên'),
  email: Yup.string()
    .email('Email không hợp lệ')
    .required('Vui lòng nhập email'),
  password: Yup.string()
    .min(6, 'Mật khẩu tối thiểu 6 ký tự')
    .required('Vui lòng nhập mật khẩu'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng nhập lại mật khẩu'),
});

const ForgotSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email không hợp lệ')
    .required('Vui lòng nhập email'),
});

// ─── HELPER: tính class cho input dựa trên touched + error ───────
// Khi user rời khỏi field (onBlur) → touched[name] = true
// Nếu có lỗi → border đỏ, nếu hợp lệ → border xanh
function getFieldClass(
  name: string,
  errors: FormikErrors<Record<string, string>>,
  touched: FormikTouched<Record<string, string>>,
  extra = '',
): string {
  const base =
    'w-full border rounded-lg px-3 py-2.5 mt-1 text-sm transition-all duration-200 outline-none';

  if (touched[name] && errors[name]) {
    return `${base} border-danger bg-red-50/50 focus:border-danger focus:ring-2 focus:ring-danger/20 ${extra}`.trim();
  }
  if (touched[name] && !errors[name]) {
    return `${base} border-success bg-green-50/30 focus:border-success focus:ring-2 focus:ring-success/20 ${extra}`.trim();
  }
  return `${base} border-border focus:border-primary focus:ring-2 focus:ring-primary/20 ${extra}`.trim();
}

// ─── HELPER ────────────────────────────
function FieldStatus({
  name,
  errors,
  touched,
}: {
  name: string;
  errors: FormikErrors<Record<string, string>>;
  touched: FormikTouched<Record<string, string>>;
}) {
  if (touched[name] && errors[name]) {
    return (
      <span className="material-icons text-danger text-base absolute right-3 top-[calc(50%+2px)] -translate-y-1/2 pointer-events-none">
        error_outline
      </span>
    );
  }
  if (touched[name] && !errors[name]) {
    return (
      <span className="material-icons text-success text-base absolute right-3 top-[calc(50%+2px)] -translate-y-1/2 pointer-events-none">
        check_circle
      </span>
    );
  }
  return null;
}

// ─── HELPER: realtime error text ───────────────────────────────────
function FieldError({ name }: { name: string }) {
  return (
    <ErrorMessage name={name}>
      {(msg) => (
        <div className="flex items-center gap-1 mt-1.5 text-danger text-xs animate-[fadeIn_0.15s_ease]">
          <span className="material-icons text-xs">info</span>
          {msg}
        </div>
      )}
    </ErrorMessage>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function AuthModal({ onClose, redirectTo, standalone }: AuthModalProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);

  const inner = (
    <>
      {!standalone && (
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
      )}
      {standalone && (
        <div className="px-1 pb-2">
          <h3 className="text-xl font-semibold text-text-primary">
            {tab === 'login' && 'Đăng nhập'}
            {tab === 'register' && 'Đăng ký'}
            {tab === 'forgot' && 'Quên mật khẩu'}
          </h3>
        </div>
      )}

      <div className={standalone ? '' : 'modal-body'}>
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

          {/* Alert lỗi từ server */}
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

          {/* ─── LOGIN FORM ─────────────────────────────────────── */}
          {tab === 'login' && (
            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={LoginSchema}
              validateOnChange={true}
              validateOnBlur={true}
              onSubmit={async (values, { setSubmitting }) => {
                setError('');
                try {
                  await dispatch(
                    signIn({ email: values.email, password: values.password }),
                  ).unwrap();
                  if (redirectTo) {
                    router.push(redirectTo);
                  } else {
                    onClose();
                  }
                } catch (err: unknown) {
                  if (err && typeof err === 'object' && 'message' in err) {
                    setError(String((err as { message: string }).message));
                  } else {
                    setError(String(err));
                  }
                }
                setSubmitting(false);
              }}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form noValidate>
                  {/* Email */}
                  <div className="form-group pb-3">
                    <label className="text-sm font-medium text-text-primary">
                      Email
                    </label>
                    <div className="relative">
                      <Field
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        className={getFieldClass(
                          'email',
                          errors as FormikErrors<Record<string, string>>,
                          touched as FormikTouched<Record<string, string>>,
                        )}
                      />
                      <FieldStatus
                        name="email"
                        errors={errors as FormikErrors<Record<string, string>>}
                        touched={
                          touched as FormikTouched<Record<string, string>>
                        }
                      />
                    </div>
                    <FieldError name="email" />
                  </div>

                  {/* Password */}
                  <div className="form-group pb-2">
                    <label className="text-sm font-medium text-text-primary">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <Field
                        name="password"
                        type={showLoginPass ? 'text' : 'password'}
                        placeholder="••••••"
                        className={getFieldClass(
                          'password',
                          errors as FormikErrors<Record<string, string>>,
                          touched as FormikTouched<Record<string, string>>,
                          'pr-10',
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPass(!showLoginPass)}
                        className="absolute right-3 top-[calc(50%+2px)] -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                        tabIndex={-1}
                      >
                        <span className="material-icons text-[18px]">
                          {showLoginPass ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    <FieldError name="password" />
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

          {/* ─── REGISTER FORM ──────────────────────────────────── */}
          {tab === 'register' && (
            <Formik
              initialValues={{
                fullName: '',
                email: '',
                password: '',
                confirmPassword: '',
              }}
              validationSchema={RegisterSchema}
              validateOnChange={true}
              validateOnBlur={true}
              onSubmit={async (values, { setSubmitting }) => {
                setError('');
                setSuccess('');
                try {
                  await dispatch(
                    signUp({
                      email: values.email,
                      password: values.password,
                      fullName: values.fullName,
                    }),
                  ).unwrap();
                  setSuccess('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
                  setTimeout(() => setTab('login'), 1500);
                } catch (err: unknown) {
                  // RTK rejectWithValue hoặc Error
                  if (err && typeof err === 'object' && 'message' in err) {
                    setError(String((err as { message: string }).message));
                  } else {
                    setError(String(err));
                  }
                }
                setSubmitting(false);
              }}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form noValidate>
                  {/* Họ tên */}
                  <div className="form-group pb-3">
                    <label className="text-sm font-medium text-text-primary">
                      Họ tên
                    </label>
                    <div className="relative">
                      <Field
                        name="fullName"
                        type="text"
                        placeholder="Nguyễn Văn A"
                        className={getFieldClass(
                          'fullName',
                          errors as FormikErrors<Record<string, string>>,
                          touched as FormikTouched<Record<string, string>>,
                        )}
                      />
                      <FieldStatus
                        name="fullName"
                        errors={errors as FormikErrors<Record<string, string>>}
                        touched={
                          touched as FormikTouched<Record<string, string>>
                        }
                      />
                    </div>
                    <FieldError name="fullName" />
                  </div>

                  {/* Email */}
                  <div className="form-group pb-3">
                    <label className="text-sm font-medium text-text-primary">
                      Email
                    </label>
                    <div className="relative">
                      <Field
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        className={getFieldClass(
                          'email',
                          errors as FormikErrors<Record<string, string>>,
                          touched as FormikTouched<Record<string, string>>,
                        )}
                      />
                      <FieldStatus
                        name="email"
                        errors={errors as FormikErrors<Record<string, string>>}
                        touched={
                          touched as FormikTouched<Record<string, string>>
                        }
                      />
                    </div>
                    <FieldError name="email" />
                  </div>

                  {/* Mật khẩu */}
                  <div className="form-group pb-3">
                    <label className="text-sm font-medium text-text-primary">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <Field
                        name="password"
                        type={showRegPass ? 'text' : 'password'}
                        placeholder="Tối thiểu 6 ký tự"
                        className={getFieldClass(
                          'password',
                          errors as FormikErrors<Record<string, string>>,
                          touched as FormikTouched<Record<string, string>>,
                          'pr-10',
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPass(!showRegPass)}
                        className="absolute right-3 top-[calc(50%+2px)] -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                        tabIndex={-1}
                      >
                        <span className="material-icons text-[18px]">
                          {showRegPass ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    <FieldError name="password" />
                  </div>

                  {/* Xác nhận mật khẩu */}
                  <div className="form-group pb-3">
                    <label className="text-sm font-medium text-text-primary">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <Field
                        name="confirmPassword"
                        type={showRegConfirmPass ? 'text' : 'password'}
                        placeholder="Nhập lại mật khẩu"
                        className={getFieldClass(
                          'confirmPassword',
                          errors as FormikErrors<Record<string, string>>,
                          touched as FormikTouched<Record<string, string>>,
                          'pr-10',
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPass(!showRegConfirmPass)}
                        className="absolute right-3 top-[calc(50%+2px)] -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                        tabIndex={-1}
                      >
                        <span className="material-icons text-[18px]">
                          {showRegConfirmPass ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    <FieldError name="confirmPassword" />
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

          {/* ─── FORGOT PASSWORD FORM ────────────────────────────── */}
          {tab === 'forgot' && (
            <Formik
              initialValues={{ email: '' }}
              validationSchema={ForgotSchema}
              validateOnChange={true}
              validateOnBlur={true}
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
              {({ isSubmitting, errors, touched }) => (
                <Form noValidate>
                  <p className="text-sm text-text-secondary mb-4">
                    Nhập email của bạn để nhận link khôi phục mật khẩu.
                  </p>
                  <div className="form-group pb-3">
                    <label className="text-sm font-medium text-text-primary">
                      Email
                    </label>
                    <div className="relative">
                      <Field
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        className={getFieldClass(
                          'email',
                          errors as FormikErrors<Record<string, string>>,
                          touched as FormikTouched<Record<string, string>>,
                        )}
                      />
                      <FieldStatus
                        name="email"
                        errors={errors as FormikErrors<Record<string, string>>}
                        touched={
                          touched as FormikTouched<Record<string, string>>
                        }
                      />
                    </div>
                    <FieldError name="email" />
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
    </>
  );

  if (standalone) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        {inner}
      </div>
    );
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal max-w-md">
        {inner}
      </div>
    </div>
  );
}
