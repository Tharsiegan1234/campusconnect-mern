import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const SportsTeamForm = ({ team = null, onSaved, onCancel }) => {
    const [loading, setLoading] = useState(false);

    const validationSchema = Yup.object({
        name: Yup.string()
            .required('Name is required')
            .matches(/^[A-Za-z\s]+$/, 'Name may only contain letters and spaces'),
        sportType: Yup.string()
            .required('Sport Type is required')
            .matches(/^[A-Za-z\s]+$/, 'Sport Type may only contain letters and spaces'),
        coach: Yup.string()
            .required('Coach is required')
            .matches(/^[A-Za-z\s]+$/, 'Coach may only contain letters and spaces'),
        maxMembers: Yup.number().nullable().transform((v, o) => (o === '' ? null : v)).min(1, 'Max members must be at least 1')
    });

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: team?.name || '',
            sportType: team?.sportType || '',
            description: team?.description || '',
            coach: team?.coach || '',
            maxMembers: team?.maxMembers || '',
            sessionDate: team?.nextSession?.date ? new Date(team.nextSession.date).toISOString().slice(0, 16) : '',
            sessionLocation: team?.nextSession?.location || '',
            sessionDescription: team?.nextSession?.description || ''
        },
        validationSchema,
        onSubmit: async (values) => {
            setLoading(true);
            const token = localStorage.getItem('token');
            try {
                const payload = { name: values.name, sportType: values.sportType, description: values.description, coach: values.coach };
                if (values.maxMembers !== null && values.maxMembers !== '') payload.maxMembers = Number(values.maxMembers);
                if (values.sessionDate) {
                    payload.nextSession = {
                        date: values.sessionDate,
                        location: values.sessionLocation || '',
                        description: values.sessionDescription || ''
                    };
                }
                let res;
                if (team && (team._id || team.id)) {
                    const id = team._id || team.id;
                    res = await fetch(`/api/sports/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(payload),
                    });
                } else {
                    res = await fetch(`/api/sports`, {
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
            <h2 className="text-xl font-bold mb-4">{team ? 'Edit Team' : 'Create Team'}</h2>
            <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input name="name" value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} className="mt-1 block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]" placeholder="e.g. Tigers" />
                    {formik.touched.name && formik.errors.name && <div className="text-xs text-red-600 mt-1 font-medium">{formik.errors.name}</div>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Sport Type</label>
                    <select name="sportType" value={formik.values.sportType || ""} onChange={formik.handleChange} onBlur={formik.handleBlur} className="mt-1 block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] bg-white text-gray-800">
                        <option value="" disabled>Select a sport...</option>
                        <option value="General">General / Athletics</option>
                        <option value="Football">Football</option>
                        <option value="Cricket">Cricket</option>
                        <option value="Basketball">Basketball</option>
                        <option value="Badminton">Badminton</option>
                        <option value="Tennis">Tennis</option>
                        <option value="Volleyball">Volleyball</option>
                        <option value="Athletics">Athletics</option>
                        <option value="Swimming">Swimming</option>
                        <option value="Table Tennis">Table Tennis</option>
                        <option value="Other">Other</option>
                    </select>
                    {formik.touched.sportType && formik.errors.sportType && <div className="text-xs text-red-600 mt-1 font-medium">{formik.errors.sportType}</div>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Max Members</label>
                    <input name="maxMembers" value={formik.values.maxMembers} onChange={formik.handleChange} onBlur={formik.handleBlur} type="number" min={1} className="mt-1 block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]" placeholder="Leave empty for unlimited" />
                    {formik.touched.maxMembers && formik.errors.maxMembers && <div className="text-xs text-red-600 mt-1 font-medium">{formik.errors.maxMembers}</div>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Coach</label>
                    <input name="coach" value={formik.values.coach} onChange={formik.handleChange} onBlur={formik.handleBlur} className="mt-1 block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]" placeholder="e.g. John Doe" />
                    {formik.touched.coach && formik.errors.coach && <div className="text-xs text-red-600 mt-1 font-medium">{formik.errors.coach}</div>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" value={formik.values.description} onChange={formik.handleChange} onBlur={formik.handleBlur} className="mt-1 block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]" rows={4} placeholder="Enter team description..." />
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">📅 Next Training Session <span className="text-xs font-normal text-gray-500">(optional)</span></h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                            <input name="sessionDate" type="datetime-local" value={formik.values.sessionDate} onChange={formik.handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Location</label>
                            <input name="sessionLocation" value={formik.values.sessionLocation} onChange={formik.handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]" placeholder="e.g. Indoor Court A" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700">Session Description</label>
                        <input name="sessionDescription" value={formik.values.sessionDescription} onChange={formik.handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]" placeholder="e.g. Weekly practice match" />
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

export default SportsTeamForm;
