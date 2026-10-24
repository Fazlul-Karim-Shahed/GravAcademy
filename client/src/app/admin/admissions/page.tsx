'use client';

import React, { useEffect, useState, useId } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  UserPlus,
  Search,
  BookOpen,
  Layers,
  CheckCircle,
  Copy,
  Check,
  CreditCard,
  Phone,
  Mail,
  GraduationCap,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldAlert,
  Printer,
  FileText,
  DollarSign,
} from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';
import { MoneyReceiptModal, PaymentReceiptData } from '@/components/finance/MoneyReceiptModal';
import { getSharedAcademicClasses, AcademicClassItem } from '@/lib/classes';

interface BatchItem {
  _id: string;
  name: string;
  fee?: number;
  capacity?: number;
  status: string;
  courseId: {
    _id: string;
    title: string;
    slug?: string;
    gradeLevel?: string;
  } | string;
}

interface CourseItem {
  _id: string;
  title: string;
  slug: string;
  gradeLevel?: string;
  price?: number;
}

interface AdmissionResult {
  isNewUserCreated: boolean;
  student: {
    _id: string;
    name: string;
    userId: string;
    phone?: string;
    email?: string;
    defaultPassword?: string | null;
  };
  batch: {
    _id: string;
    name: string;
    course: any;
  };
  enrollment: any;
  payment?: PaymentReceiptData;
}

interface EnrollmentRecord {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    userId: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    studentDetails?: {
      schoolOrCollege?: string;
      gradeLevel?: string;
    };
  };
  batchId: {
    _id: string;
    name: string;
    fee?: number;
    status: string;
  };
  courseId: {
    _id: string;
    title: string;
  };
  enrolledBy?: {
    name: string;
    userId: string;
  };
  paymentFee: number;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  enrolledAt: string;
}

export default function AdminAdmissionsPage() {
  const { user } = useAuth();

  // Data sources
  const [academicClasses, setAcademicClasses] = useState<AcademicClassItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseItem[]>([]);
  const [allBatches, setAllBatches] = useState<BatchItem[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<BatchItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form Fields
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [schoolOrCollege, setSchoolOrCollege] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [paymentFee, setPaymentFee] = useState<number | string>(0);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank_transfer' | 'other'>('cash');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Submitting state & Response Modal
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successModalData, setSuccessModalData] = useState<AdmissionResult | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceiptData | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Recent Admissions List
  const [recentAdmissions, setRecentAdmissions] = useState<EnrollmentRecord[]>([]);
  const [loadingAdmissions, setLoadingAdmissions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();
    fetchRecentAdmissions();
  }, []);

  // Filter courses & batches when gradeLevel (class) changes
  useEffect(() => {
    if (!gradeLevel) {
      setFilteredCourses(courses);
      setFilteredBatches(allBatches);
      return;
    }

    // Match courses belonging to the selected class
    const matchedCourses = courses.filter((c) => {
      if (!c.gradeLevel) return false;
      return c.gradeLevel.trim().toLowerCase() === gradeLevel.trim().toLowerCase();
    });
    setFilteredCourses(matchedCourses);

    // If currently selected course is not in the matched courses, reset course
    if (selectedCourseId && !matchedCourses.some((c) => c._id === selectedCourseId)) {
      setSelectedCourseId('');
    }

    // Match batches belonging to the filtered courses or matching gradeLevel
    const matchedCourseIds = new Set(matchedCourses.map((c) => c._id));
    const matchedBatches = allBatches.filter((b) => {
      const cId = typeof b.courseId === 'string' ? b.courseId : b.courseId?._id;
      const bGrade = typeof b.courseId === 'object' && b.courseId ? b.courseId.gradeLevel : '';
      return (cId && matchedCourseIds.has(cId)) || (bGrade && bGrade.trim().toLowerCase() === gradeLevel.trim().toLowerCase());
    });
    setFilteredBatches(matchedBatches);

    if (selectedBatchId && !matchedBatches.some((b) => b._id === selectedBatchId)) {
      setSelectedBatchId('');
    }
  }, [gradeLevel, courses, allBatches]);

  // Filter batches when specific course selection changes
  useEffect(() => {
    if (!selectedCourseId) {
      // If course is deselected, fallback to batches filtered by gradeLevel
      if (gradeLevel) {
        const matchedCourses = courses.filter(
          (c) => c.gradeLevel && c.gradeLevel.trim().toLowerCase() === gradeLevel.trim().toLowerCase()
        );
        const matchedCourseIds = new Set(matchedCourses.map((c) => c._id));
        setFilteredBatches(
          allBatches.filter((b) => {
            const cId = typeof b.courseId === 'string' ? b.courseId : b.courseId?._id;
            return cId && matchedCourseIds.has(cId);
          })
        );
      } else {
        setFilteredBatches(allBatches);
      }
      return;
    }

    const matched = allBatches.filter((b) => {
      const cId = typeof b.courseId === 'string' ? b.courseId : b.courseId?._id;
      return cId === selectedCourseId;
    });
    setFilteredBatches(matched);

    if (selectedBatchId) {
      const exists = matched.some((b) => b._id === selectedBatchId);
      if (!exists) {
        setSelectedBatchId('');
      }
    }
  }, [selectedCourseId, gradeLevel, allBatches, courses]);

  // Auto-fill fee when batch changes
  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    const chosenBatch = allBatches.find((b) => b._id === batchId);
    if (chosenBatch) {
      if (chosenBatch.fee !== undefined && chosenBatch.fee > 0) {
        setPaymentFee(chosenBatch.fee);
      } else {
        const chosenCourse = courses.find((c) => {
          const cId = typeof chosenBatch.courseId === 'string' ? chosenBatch.courseId : chosenBatch.courseId?._id;
          return c._id === cId;
        });
        if (chosenCourse?.price) {
          setPaymentFee(chosenCourse.price);
        } else {
          setPaymentFee(0);
        }
      }

      // Also auto-select course and gradeLevel if not selected
      const cId = typeof chosenBatch.courseId === 'string' ? chosenBatch.courseId : chosenBatch.courseId?._id;
      if (cId && cId !== selectedCourseId) {
        setSelectedCourseId(cId);
      }
      const cGrade = typeof chosenBatch.courseId === 'object' && chosenBatch.courseId ? chosenBatch.courseId.gradeLevel : '';
      if (cGrade && !gradeLevel) {
        setGradeLevel(cGrade);
      }
    }
  };

  const fetchInitialData = async () => {
    setLoadingData(true);
    try {
      const [coursesRes, batchesRes, classesList] = await Promise.all([
        api.get('/courses'),
        api.get('/batches'),
        getSharedAcademicClasses(),
      ]);

      const cList = coursesRes.data?.data || [];
      const bList = batchesRes.data?.data || [];

      setAcademicClasses(classesList || []);
      setCourses(cList);
      setFilteredCourses(cList);
      setAllBatches(bList);
      setFilteredBatches(bList);
    } catch (e: any) {
      console.error('Failed to load classes, courses or batches:', e);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchRecentAdmissions = async (keyword = '') => {
    setLoadingAdmissions(true);
    try {
      const params: any = { limit: 15 };
      if (keyword.trim()) {
        params.search = keyword.trim();
      }
      const res = await api.get('/enrollments/admin-list', { params });
      setRecentAdmissions(res.data.data || []);
    } catch (e: any) {
      console.error('Failed to load admissions:', e);
    } finally {
      setLoadingAdmissions(false);
    }
  };

  const handleSubmitAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!studentName.trim()) {
      setErrorMsg('শিক্ষার্থীর নাম প্রদান করা আবশ্যক।');
      return;
    }
    if (!selectedBatchId) {
      setErrorMsg('অনুগ্রহ করে ভর্তির জন্য একটি ব্যাচ নির্বাচন করুন।');
      return;
    }
    if (!studentPhone.trim() && !studentEmail.trim()) {
      setErrorMsg('যোগাযোগের জন্য শিক্ষার্থীর ফোন নম্বর অথবা ইমেইল যেকোনো একটি অবশ্যই দেওয়া প্রয়োজন।');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: studentName.trim(),
        phone: studentPhone.trim() || undefined,
        email: studentEmail.trim() || undefined,
        schoolOrCollege: schoolOrCollege.trim() || undefined,
        gradeLevel: gradeLevel.trim() || undefined,
        guardianName: guardianName.trim() || undefined,
        guardianPhone: guardianPhone.trim() || undefined,
        batchId: selectedBatchId,
        paymentFee: Number(paymentFee) || 0,
        paymentStatus,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        senderNumber: senderNumber.trim() || undefined,
        documentUrl: documentUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await api.post('/enrollments/admin-admit', payload);

      if (res.data.success) {
        setSuccessModalData(res.data);
        // Clear main fields
        setStudentName('');
        setStudentPhone('');
        setStudentEmail('');
        setSchoolOrCollege('');
        setGuardianName('');
        setGuardianPhone('');
        setTransactionId('');
        setSenderNumber('');
        setDocumentUrl('');
        setNotes('');
        fetchRecentAdmissions();
      } else {
        setErrorMsg(res.data.message || 'ভর্তি প্রক্রিয়া সম্পন্ন করা সম্ভব হয়নি।');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'ভর্তি সম্পন্ন করার সময় ত্রুটি ঘটেছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'id' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/admin"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> অ্যাডমিন ড্যাশবোর্ড
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-xs font-semibold text-slate-500">ভর্তি মডিউল</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <UserPlus className="w-6 h-6" />
              </span>
              ম্যানুয়াল শিক্ষার্থী ভর্তি (Admin Admission)
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/batches"
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-indigo-500" /> ব্যাচসমূহ
            </Link>
          </div>
        </div>

        {/* Two Column Grid: Form (Left) & Recent Admissions (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Admission Form (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    শিক্ষার্থীর ভর্তির তথ্য ফরম
                  </h2>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                  ডিফল্ট পাসওয়ার্ড = ইউজার আইডি
                </span>
              </div>

              {errorMsg && (
                <div className="p-4 mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div>
                    <strong className="font-bold">ভর্তি প্রক্রিয়া ব্যর্থ হয়েছে:</strong> {errorMsg}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitAdmission} className="space-y-5">
                
                {/* 1. Student Personal Information */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-blue-500" /> ১. শিক্ষার্থীর মৌলিক তথ্য
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Student Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        শিক্ষার্থীর পুরো নাম <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="যেমন: সাকিব আল হাসান"
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Student Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        মোবাইল নম্বর <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          value={studentPhone}
                          onChange={(e) => setStudentPhone(e.target.value)}
                          placeholder="017XXXXXXXX"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Student Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        ইমেইল ঠিকানা (ঐচ্ছিক)
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="student@example.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* School / College */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        স্কুল / কলেজ / প্রতিষ্ঠান
                      </label>
                      <input
                        type="text"
                        value={schoolOrCollege}
                        onChange={(e) => setSchoolOrCollege(e.target.value)}
                        placeholder="যেমন: নটর ডেম কলেজ"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Grade Level Dropdown (from created academic classes) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>শ্রেণি / ক্লাস <span className="text-blue-500">*</span></span>
                        {gradeLevel && (
                          <button
                            type="button"
                            onClick={() => setGradeLevel('')}
                            className="text-[10px] text-slate-400 hover:text-rose-500 font-semibold"
                          >
                            রিসেট
                          </button>
                        )}
                      </label>
                      <select
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      >
                        <option value="">-- শ্রেণি / ক্লাস নির্বাচন করুন --</option>
                        {academicClasses.map((cls) => (
                          <option key={cls._id || cls.name} value={cls.name}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Course & Batch Selection */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-500" /> ২. কোর্স ও ব্যাচ নির্বাচন
                    </h3>
                    {gradeLevel && (
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 px-2.5 py-0.5 rounded-lg border border-blue-200/60 dark:border-blue-800/60">
                        {gradeLevel}-এর কোর্স ও ব্যাচ
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Course Filter Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        কোর্স ফিল্টার (ঐচ্ছিক)
                      </label>
                      <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="">-- {gradeLevel ? `${gradeLevel}-এর সব কোর্স` : 'সব কোর্স থেকে দেখুন'} --</option>
                        {filteredCourses.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.title} {c.gradeLevel ? `(${c.gradeLevel})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Batch Selection Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        ভর্তির ব্যাচ নির্বাচন করুন <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedBatchId}
                        onChange={(e) => handleBatchChange(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      >
                        <option value="">-- ব্যাচ নির্বাচন করুন --</option>
                        {filteredBatches.map((b) => {
                          const courseTitle = typeof b.courseId === 'object' && b.courseId ? b.courseId.title : '';
                          return (
                            <option key={b._id} value={b._id}>
                              {b.name} {courseTitle ? `[${courseTitle}]` : ''} {b.fee ? `- ৳${b.fee}` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Fee & Payment Status */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-500" /> ৩. ভর্তি ফি ও পেমেন্ট বিবরণী
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Payment Fee */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        ভর্তি ফি / পরিশোধিত টাকা (৳)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">৳</span>
                        <input
                          type="number"
                          min="0"
                          value={paymentFee}
                          onChange={(e) => setPaymentFee(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                        />
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        পেমেন্ট অবস্থা
                      </label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      >
                        <option value="paid">পরিশোধিত (Paid)</option>
                        <option value="partial">আংশিক পরিশোধ (Partial)</option>
                        <option value="unpaid">বকেয়া / অপরিশোধিত (Unpaid)</option>
                      </select>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        পেমেন্ট মাধ্যম (Payment Method)
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      >
                        <option value="cash">💵 সরাসরি ক্যাশ (Cash)</option>
                        <option value="bkash">📱 পার্সোনাল বিকাশ (bKash)</option>
                        <option value="nagad">📱 নগদ (Nagad)</option>
                        <option value="rocket">📱 রকেট (Rocket)</option>
                        <option value="bank_transfer">🏦 ব্যাংক ট্রান্সফার (Bank)</option>
                        <option value="other">অন্যান্য (Other)</option>
                      </select>
                    </div>

                    {/* Transaction ID / Sender Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {paymentMethod === 'cash'
                          ? 'রেফারেন্স / ক্যাশ রিসিট নং (ঐচ্ছিক)'
                          : paymentMethod === 'bank_transfer'
                          ? 'চেক / একাউন্ট / ব্যাংক ট্রানজ্যাকশন নং'
                          : 'বিকাশ/নগদ TrxID বা প্রেরকের নম্বর'}
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder={paymentMethod === 'cash' ? 'যেমন: Slip-01' : 'যেমন: 9J3K8... বা প্রেরক নম্বর'}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                      />
                    </div>

                    {/* Document / Slip URL */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        পেমেন্ট প্রমাণপত্র / স্লিপ ডকুমেন্ট লিংক (ঐচ্ছিক)
                      </label>
                      <input
                        type="url"
                        value={documentUrl}
                        onChange={(e) => setDocumentUrl(e.target.value)}
                        placeholder="যেমন: গুগল ড্রাইভ / ইমেজ লিংক বা স্লিপ ডকুমেন্টের URL"
                        className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Notes */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        অতিরিক্ত মন্তব্য (ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="যেমন: অফিসে এসে প্রদান করা হয়েছে..."
                        className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-extrabold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        শিক্ষার্থীকে ভর্তি করা হচ্ছে...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        শিক্ষার্থী ভর্তি সম্পন্ন করুন এবং আইডি তৈরি করুন
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-2">
                    * সাবমিট করার সাথে সাথে নতুন শিক্ষার্থীর জন্য একটি ইউনিক আইডি জেনারেট হবে এবং স্বয়ংক্রিয়ভাবে পাসওয়ার্ড হিসেবে আইডি সেট হবে।
                  </p>
                </div>

              </form>
            </div>
          </div>

          {/* RIGHT: Recent Admissions Feed (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col h-full max-h-[820px]">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" /> সম্প্রতি ভর্তি হওয়া শিক্ষার্থী
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">সর্বশেষ এডমিন অ্যাডমিশন তালিকা</p>
                </div>
                <button
                  onClick={() => fetchRecentAdmissions(searchQuery)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="রিফ্রেশ করুন"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Search Admissions */}
              <div className="my-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      fetchRecentAdmissions(e.target.value);
                    }}
                    placeholder="নাম, ইউজার আইডি বা ফোন দিয়ে খুঁজুন..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {loadingAdmissions ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    তালিকা লোড হচ্ছে...
                  </div>
                ) : recentAdmissions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    কোনো ভর্তির তথ্য পাওয়া যায়নি।
                  </div>
                ) : (
                  recentAdmissions.map((adm) => (
                    <div
                      key={adm._id}
                      className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-3"
                    >
                      {/* Left: Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {adm.studentId?.name || 'অজ্ঞাত শিক্ষার্থী'}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            #{adm.studentId?.userId || 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {adm.studentId?.phone && (
                            <span>{adm.studentId.phone}</span>
                          )}
                          {adm.studentId?.phone && adm.batchId?.name && (
                            <span>•</span>
                          )}
                          {adm.batchId?.name && (
                            <span className="text-slate-600 dark:text-slate-300 font-medium">
                              {adm.batchId.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Fee & Status */}
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          ৳{adm.paymentFee?.toLocaleString('bn-BD') || 0}
                        </div>
                        <span
                          className={`text-[11px] font-medium inline-block mt-0.5 ${
                            adm.paymentStatus === 'paid'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : adm.paymentStatus === 'partial'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {adm.paymentStatus === 'paid'
                            ? 'পরিশোধিত'
                            : adm.paymentStatus === 'partial'
                            ? 'আংশিক'
                            : 'বকেয়া'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>

        </div>

        {/* SUCCESS CONFIRMATION MODAL WITH CREDENTIALS */}
        {successModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 overflow-hidden">
              
              {/* Background gradient decorative glow */}
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-gradient-to-br from-emerald-400/20 to-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    ভর্তি সফলভাবে সম্পন্ন হয়েছে!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    শিক্ষার্থীকে ব্যাচে যুক্ত করা হয়েছে এবং লগইন তথ্য তৈরি করা হয়েছে।
                  </p>
                </div>
              </div>

              {/* Student Credentials Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/80 dark:to-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 mb-6 space-y-3.5">
                
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                    শিক্ষার্থীর নাম
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {successModalData.student.name}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                    ব্যাচের নাম
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {successModalData.batch.name}
                  </div>
                </div>

                {/* User ID Field with Copy Button */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      লগইন ইউজার আইডি (User ID)
                    </span>
                    <button
                      onClick={() => copyToClipboard(successModalData.student.userId, 'id')}
                      className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-semibold"
                    >
                      {copiedId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> কপি হয়েছে
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> কপি করুন
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-base font-extrabold text-blue-600 dark:text-blue-400 tracking-wider">
                    {successModalData.student.userId}
                  </div>
                </div>

                {/* Default Password Field with Copy Button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      ডিফল্ট পাসওয়ার্ড (Password = User ID)
                    </span>
                    <button
                      onClick={() => copyToClipboard(successModalData.student.userId, 'pass')}
                      className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                    >
                      {copiedPass ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> কপি হয়েছে
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> কপি করুন
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-base font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                    {successModalData.student.userId}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    💡 শিক্ষার্থী এই ইউজার আইডি এবং পাসওয়ার্ড দিয়ে ওয়েবসাইটে সরাসরি লগইন করতে পারবে।
                  </p>
                </div>

              </div>

              {/* Close / Action Button */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {successModalData.payment && (
                  <button
                    onClick={() => {
                      setActiveReceipt(successModalData.payment || null);
                    }}
                    className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    <Printer className="w-4 h-4" />
                    মানি রিসিট প্রিন্ট করুন
                  </button>
                )}
                <button
                  onClick={() => setSuccessModalData(null)}
                  className={`w-full ${
                    successModalData.payment ? 'sm:w-1/2' : ''
                  } py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors`}
                >
                  ঠিক আছে, সম্পন্ন করুন
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Money Receipt Modal */}
        <MoneyReceiptModal
          isOpen={!!activeReceipt}
          onClose={() => setActiveReceipt(null)}
          data={activeReceipt}
        />

      </div>
    </div>
  );
}
