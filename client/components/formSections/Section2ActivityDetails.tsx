import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export default function DataDetails({ form, handleChange, errors, disabled }: any) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border-l-[6px] border-l-primary">
            {/* Header with Red Accent and Information Icon */}
            <div className="flex items-center gap-4 px-8 py-6">
                <div className="bg-primary/5 p-2.5 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl font-semibold">
                        assignment_ind
                    </span>
                </div>
                <h2 className="font-bold text-xl text-black tracking-tight">
                    ส่วนที่ 2 : รายละเอียดกิจกรรม
                </h2>
            </div>

            <div className="px-8 pb-8 space-y-6">
                <div className="grid grid-cols-1">
                    <Input
                        label="ชื่อเจ้าของข้อมูลส่วนบุคคล"
                        name="dataSubjectName"
                        value={form?.dataSubjectName || ""}
                        placeholder="ระบุเจ้าของข้อมูล (เช่น บริษัท A)"
                        required
                        onChange={handleChange}
                        error={errors?.dataSubjectName}
                        disabled={disabled}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <Input
                        label="กิจกรรมประมวลผล"
                        name="processingActivity"
                        value={form?.processingActivity || ""}
                        placeholder="ระบุกิจกรรมประมวลผล (เช่น การรับสมัครพนักงาน)"
                        required
                        onChange={handleChange}
                        error={errors?.processingActivity}
                        disabled={disabled}
                    />
                    <Input
                        label="วัตถุประสงค์การประมวลผล"
                        name="purpose"
                        value={form?.purpose || ""}
                        placeholder="ระบุวัตถุประสงค์การประมวลผล (เช่น เพื่อรับสมัครบุคคลเข้าทำงาน)"
                        required
                        onChange={handleChange}
                        error={errors?.purpose}
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
}

