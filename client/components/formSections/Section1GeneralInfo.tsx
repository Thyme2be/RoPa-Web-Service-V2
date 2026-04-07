import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export default function GeneralInfo({ form, handleChange, errors, disabled }: any) {
    const titleOptions = [
        { label: "คำนำหน้า", value: "" },
        { label: "นาย", value: "นาย" },
        { label: "นาง", value: "นาง" },
        { label: "นางสาว", value: "นางสาว" },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-primary">
            {/* Header with Red Accent and Information Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className="bg-primary/5 p-2.5 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl font-semibold">
                        person
                    </span>
                </div>
                <h2 className="font-bold text-xl text-black tracking-tight">
                    ส่วนที่ 1 : รายละเอียดของผู้ลงบันทึก RoPA
                </h2>
            </div>

            <div className="px-8 pb-8 space-y-6">
                {/* Row 1: Name and Address Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Name Part with 3 sub-fields */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-extrabold text-[#5C403D] block tracking-tight">
                            ชื่อ-นามสกุล <span className="text-primary">*</span>
                        </label>
                        <div className="flex items-start gap-3">
                            <div className="w-[120px] shrink-0">
                                <Select
                                    name="title"
                                    value={form?.title || ""}
                                    onChange={handleChange}
                                    options={titleOptions}
                                    required
                                    error={errors?.title}
                                    disabled={disabled}
                                />
                            </div>
                            <div className="flex-1">
                                <Input
                                    name="firstName"
                                    placeholder="ระบุชื่อจริง"
                                    value={form?.firstName || ""}
                                    onChange={handleChange}
                                    required
                                    error={errors?.firstName}
                                    disabled={disabled}
                                />
                            </div>
                            <div className="flex-1">
                                <Input
                                    name="lastName"
                                    placeholder="ระบุนามสกุล"
                                    value={form?.lastName || ""}
                                    onChange={handleChange}
                                    required
                                    error={errors?.lastName}
                                    disabled={disabled}
                                />
                            </div>
                        </div>
                    </div>

                    <Input
                        label="ที่อยู่"
                        name="address"
                        required
                        placeholder="ระบุที่อยู่สำนักงาน/หน่วยงาน"
                        value={form?.address || ""}
                        onChange={handleChange}
                        error={errors?.address}
                        disabled={disabled}
                    />
                </div>

                {/* Row 2: Contact Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <Input
                        label="อีเมล"
                        name="email"
                        type="email"
                        required
                        placeholder="example@netbay.co.th"
                        value={form?.email || ""}
                        onChange={handleChange}
                        error={errors?.email}
                        disabled={disabled}
                    />
                    <Input
                        label="เบอร์โทรศัพท์"
                        name="phoneNumber"
                        required
                        placeholder="02-XXX-XXXX"
                        value={form?.phoneNumber || ""}
                        onChange={handleChange}
                        error={errors?.phoneNumber}
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
}
