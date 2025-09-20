import React, { useState, useEffect } from 'react';

const EditStudentModal = ({ student, isOpen, onClose, onUpdate, LOP_LIST }) => {
    const [formData, setFormData] = useState({
        tenThanh: '',
        hoTen: '',
        ngaySinh: '',
        lop: '',
        soDienThoai: '',
        tenCha: '',
        tenMe: '',
        soDienThoaiCha: '',
        soDienThoaiMe: '',
        email: ''
    });

    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (student) {
            setFormData({
                tenThanh: student.tenThanh || '',
                hoTen: student.hoTen || '',
                ngaySinh: student.ngaySinh || '',
                lop: student.lop || LOP_LIST[0],
                soDienThoai: student.soDienThoai || '',
                tenCha: student.tenCha || '',
                tenMe: student.tenMe || '',
                soDienThoaiCha: student.soDienThoaiCha || '',
                soDienThoaiMe: student.soDienThoaiMe || '',
                email: student.email || ''
            });
        }
    }, [student, LOP_LIST]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsEditing(true);

        const success = await onUpdate(student.id, formData);
        if (success) {
            onClose();
        }

        setIsEditing(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Thêm hàm format phone trong component
    const formatPhoneInput = (value) => {
        if (!value) return '';

        // Chỉ giữ lại số
        let cleaned = value.toString().replace(/\D/g, '');

        // Format số điện thoại Việt Nam
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
            return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
        } else if (cleaned.length === 9) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        }

        return cleaned;
    };

    // Thêm handler cho input phone
    const handlePhoneChange = (e) => {
        const { name, value } = e.target;
        const formattedValue = formatPhoneInput(value);
        setFormData(prev => ({
            ...prev,
            [name]: formattedValue
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2>Chỉnh Sửa Học Sinh</h2>
                    <button onClick={onClose} className="modal-close-btn">×</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Tên Thánh</label>
                            <input
                                type="text"
                                name="tenThanh"
                                value={formData.tenThanh}
                                onChange={handleChange}
                                placeholder="Tên Thánh"
                            />
                        </div>

                        <div className="form-group">
                            <label>Họ Tên *</label>
                            <input
                                type="text"
                                name="hoTen"
                                value={formData.hoTen}
                                onChange={handleChange}
                                required
                                placeholder="Họ và tên"
                            />
                        </div>

                        <div className="form-group">
                            <label>Ngày Sinh</label>
                            <input
                                type="date"
                                name="ngaySinh"
                                value={formData.ngaySinh}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Lớp *</label>
                            <select
                                name="lop"
                                value={formData.lop}
                                onChange={handleChange}
                                required
                            >
                                {LOP_LIST.map(lop => (
                                    <option key={lop} value={lop}>{lop}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>SĐT Cá Nhân</label>
                            <input
                                type="tel"
                                name="soDienThoai"
                                value={formData.soDienThoai}
                                onChange={handlePhoneChange}
                                placeholder="Số điện thoại"
                            />
                        </div>

                        <div className="form-group">
                            <label>Tên Cha</label>
                            <input
                                type="text"
                                name="tenCha"
                                value={formData.tenCha}
                                onChange={handleChange}
                                placeholder="Tên cha"
                            />
                        </div>

                        <div className="form-group">
                            <label>SĐT Cha</label>
                            <input
                                type="tel"
                                name="soDienThoaiCha"
                                value={formData.soDienThoaiCha}
                                onChange={handlePhoneChange}
                                placeholder="SĐT cha"
                            />
                        </div>

                        <div className="form-group">
                            <label>Tên Mẹ</label>
                            <input
                                type="text"
                                name="tenMe"
                                value={formData.tenMe}
                                onChange={handleChange}
                                placeholder="Tên mẹ"
                            />
                        </div>

                        <div className="form-group">
                            <label>SĐT Mẹ</label>
                            <input
                                type="tel"
                                name="soDienThoaiMe"
                                value={formData.soDienThoaiMe}
                                onChange={handlePhoneChange}
                                placeholder="SĐT mẹ"
                            />
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email"
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                            disabled={isEditing}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isEditing}
                        >
                            {isEditing ? 'Đang cập nhật...' : 'Cập nhật'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditStudentModal;