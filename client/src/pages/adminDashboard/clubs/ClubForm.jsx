import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const ClubForm = ({ club = null, onSaved, onCancel }) => {
    const [loading, setLoading] = useState(false);

    const validationSchema = Yup.object({
        name: Yup.string()
            .required('Name is required')
            .matches(/^[A-Za-z\s]+$/, 'Name may only contain letters and spaces'),
        coach: Yup.string()
            .required('Coach is required')
            .matches(/^[A-Za-z\s]+$/, 'Coach may only contain letters and spaces'),
        maxMembers: Yup.number().nullable().transform((v, o) => (o === '' ? null : v)).min(1, 'Max members must be at least 1')
    });

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: club?.name || '',
            description: club?.description || '',
            coach: club?.coach || '',
            maxMembers: club?.maxMembers || '',
            sessionDate: club?.nextSession?.date ? new Date(club.nextSession.date).toISOString().slice(0, 16) : '',
            sessionLocation: club?.nextSession?.location || '',
            sessionDescription: club?.nextSession?.description || ''
        },
        validationSchema,
        onSubmit: async (values) => {
            setLoading(true);
            const token = localStorage.getItem('token');
            try {
                const payload = { name: values.name, description: values.description, coach: values.coach };
                if (values.maxMembers !== null && values.maxMembers !== '') payload.maxMembers = Number(values.maxMembers);
                if (values.sessionDate) {
                    payload.nextSession = {
                        date: values.sessionDate,
                        location: values.sessionLocation || '',
                        description: values.sessionDescription || ''
                    };
                }
                let res;
                if (club && (club._id || club.id)) {
                    const id = club._id || club.id;
                    res = await fetch(`/api/clubs/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(payload),
                    });
                } else {
                    res = await fetch(`/api/clubs`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(payload),
                    });
                }
                const body = await res.json();
                if (!res.ok) throw new Error(body.message || 'Save failed');
                onSaved && onSaved(body);
            } catch (err) {
                alert(err.message || 'Save failed');
            } finally {
                setLoading(false);
            }
        }
    });

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">{club ? 'Edit Club' : 'Create Club'}</h2>
            <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
                <div>
                    <label className="block text-sm font-medium">Name</label>
                    <input name="name" value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} className="mt-1 block w-full border rounded-md p-2" />
                    {formik.touched.name && formik.errors.name && <div className="text-xs text-red-600 mt-1">{formik.errors.name}</div>}
                </div>

                <div>
                    <label className="block text-sm font-medium">Max Members</label>
                    <input name="maxMembers" value={formik.values.maxMembers} onChange={formik.handleChange} onBlur={formik.handleBlur} type="number" min={1} className="mt-1 block w-full border rounded-md p-2" placeholder="Leave empty for unlimited" />
                    {formik.touched.maxMembers && formik.errors.maxMembers && <div className="text-xs text-red-600 mt-1">{formik.errors.maxMembers}</div>}
                </div>

                <div>
                    <label className="block text-sm font-medium">Coach</label>
                    <input name="coach" value={formik.values.coach} onChange={formik.handleChange} onBlur={formik.handleBlur} className="mt-1 block w-full border rounded-md p-2" />
                    {formik.touched.coach && formik.errors.coach && <div className="text-xs text-red-600 mt-1">{formik.errors.coach}</div>}
                </div>

                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea name="description" value={formik.values.description} onChange={formik.handleChange} onBlur={formik.handleBlur} className="mt-1 block w-full border rounded-md p-2" rows={4} />
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">📅 Next Meeting Session <span className="text-xs font-normal text-gray-500">(optional)</span></h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                            <input name="sessionDate" type="datetime-local" value={formik.values.sessionDate} onChange={formik.handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Location</label>
                            <input name="sessionLocation" value={formik.values.sessionLocation} onChange={formik.handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]" placeholder="e.g. Room 204" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700">Session Description</label>
                        <input name="sessionDescription" value={formik.values.sessionDescription} onChange={formik.handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]" placeholder="e.g. Weekly brainstorming session" />
                    </div>
                </div>

                <div className="flex gap-2 justify-end">
                    <button type="button" onClick={onCancel} className="btn-outline">Cancel</button>
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                </div>
            </form>
        </div>
    );
};

export default ClubForm;
