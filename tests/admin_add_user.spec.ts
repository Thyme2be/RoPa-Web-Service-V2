import { test, expect } from '@playwright/test';

test('ทดสอบแอดมิน: เพิ่มผู้ใช้ใหม่และตรวจสอบในตาราง', async ({ page, context }) => {
    // 1. เซ็ต Cookie เพื่อให้ข้าม Middleware ได้ (สำคัญมาก!)
    await context.addCookies([
        {
            name: 'token',
            value: 'mock-admin-token',
            domain: 'localhost',
            path: '/',
        },
        {
            name: 'userRole',
            value: 'ADMIN',
            domain: 'localhost',
            path: '/',
        }
    ]);

    // 2. จำลอง LocalStorage ด้วย (เผื่อโค้ดในหน้าจอดึงไปใช้)
    await page.addInitScript(() => {
        window.localStorage.setItem('token', 'mock-admin-token');
        window.localStorage.setItem('userRole', 'ADMIN');
    });

    // 3. Mock API พื้นฐาน
    await page.route('**/auth/me', async route => {
        await route.fulfill({ json: { first_name: 'Admin', last_name: 'Tester', role: 'ADMIN' } });
    });
    await page.route('**/admin/departments*', async route => {
        await route.fulfill({ json: { items: [{ id: 1, name: 'แผนก IT' }], total: 1 } });
    });
    await page.route('**/admin/companies*', async route => {
        await route.fulfill({ json: { items: [{ id: 1, name: 'บริษัท A' }], total: 1 } });
    });
    await page.route('**/admin/users?page=1*', async route => {
        await route.fulfill({ json: { items: [], total: 0 } });
    });

    // 4. ไปที่หน้าจัดการผู้ใช้
    await page.goto('http://localhost:3000/admin/tables/users');

    // 5. รอให้หน้าโหลดเสร็จ และตรวจสอบว่าอยู่ที่ URL ที่ถูกต้อง (ไม่โดน Redirect ไป /login)
    await expect(page).toHaveURL(/.*admin\/tables\/users/);

    // 6. คลิกปุ่ม "เพิ่มผู้ใช้ใหม่"
    const addBtn = page.locator('button:has-text("เพิ่มผู้ใช้ใหม่")');
    await addBtn.waitFor({ state: 'visible' });
    await addBtn.click();

    // 7. กรอกข้อมูลใน Modal
    await page.getByPlaceholder('Admin01').fill('RoPa_Tester');
    await page.getByPlaceholder('พรรษชล').fill('สมชาย');
    await page.getByPlaceholder('บุญมาก').fill('รักระบบ');
    await page.getByPlaceholder('phatsachoneiei@gmail.com').fill('somchai@test.com');
    await page.getByPlaceholder('•••••••').fill('password123');

    // 8. Mock POST API
    await page.route('**/admin/users', async route => {
        if (route.request().method() === 'POST') {
            await route.fulfill({ status: 201, json: { message: 'Created' } });
        }
    });

    // 9. Mock ข้อมูลใหม่สำหรับตาราง (แก้ไขตรงนี้)
    await page.route('**/admin/users?page=1*', async route => {
        await route.fulfill({
            json: {
                items: [
                    {
                        id: 999,
                        user_code: 'USER-999',
                        username: 'RoPa_Tester',
                        title: 'นาย',           // เพิ่มฟิลด์นี้
                        first_name: 'สมชาย',    // เพิ่มฟิลด์นี้
                        last_name: 'รักระบบ',   // เพิ่มฟิลด์นี้
                        email: 'somchai@test.com',
                        role: 'ADMIN',         // ส่งเป็น Enum เดี๋ยว UI จะแปลงเป็น 'ผู้ดูแลระบบ' เอง
                        department: 'แผนก IT',
                        status: 'ACTIVE'
                    }
                ],
                total: 1
            }
        });
    });

    // 10. กดปุ่มสร้าง
    const submitBtn = page.locator('button:has-text("สร้างผู้ใช้งาน")');
    await submitBtn.click();

    // 11. ตรวจสอบผลลัพธ์
    // ตรวจสอบว่าในตารางมีชื่อ "สมชาย รักระบบ" และอีเมลถูกต้อง
    await expect(page.locator('table')).toContainText('สมชาย รักระบบ');
    await expect(page.locator('table')).toContainText('somchai@test.com');
});

