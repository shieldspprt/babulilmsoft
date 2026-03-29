-- Populate database with sample data (fixed payment methods)
-- This script adds teachers, parents, students, and related entries with varied dates

-- Insert Teachers
INSERT INTO public.teachers (teacher_id, first_name, last_name, father_name, cnic, employee_type, education, institute, home_address, home_phone, personal_phone, date_of_birth, date_of_joining, assigned_class, is_active) VALUES
('T0001-25AR', 'Ahmed', 'Raza', 'Muhammad Raza', '3520212345671', 'teacher', 'M.A Education', 'Punjab University', 'House 45, Street 12, Model Town', '042-35678901', '0300-1234567', '1985-03-15', '2020-08-15', 'Class 1', true),
('T0002-25SK', 'Sara', 'Khan', 'Ali Khan', '3520223456782', 'teacher', 'M.Sc Mathematics', 'Government College', 'Flat 23, Garden Block', '042-35678902', '0301-2345678', '1988-06-22', '2021-01-10', 'Class 2', true),
('T0003-25FH', 'Fatima', 'Hassan', 'Hassan Ali', '3520234567893', 'teacher', 'M.A English', 'Kinnaird College', 'House 67, Johar Town', '042-35678903', '0302-3456789', '1990-09-10', '2021-09-01', 'Class 3', true),
('T0004-25MA', 'Muhammad', 'Akram', 'Abdul Akram', '3520245678904', 'teacher', 'M.Ed', 'Allama Iqbal University', 'House 89, DHA Phase 3', '042-35678904', '0303-4567890', '1987-12-05', '2019-08-20', 'Class 4', true),
('T0005-25AS', 'Aisha', 'Siddiqui', 'Farhan Siddiqui', '3520256789015', 'teacher', 'M.Sc Physics', 'LUMS', 'Apartment 12, Gulberg', '042-35678905', '0304-5678901', '1989-04-18', '2022-03-15', 'Class 5', true),
('T0006-25ZA', 'Zainab', 'Ahmad', 'Nasir Ahmad', '3520267890126', 'teacher', 'M.A Urdu', 'Punjab University', 'House 34, Township', '042-35678906', '0305-6789012', '1991-07-25', '2022-08-10', 'Class 6', true),
('T0007-25UI', 'Usman', 'Iqbal', 'Iqbal Mahmood', '3520278901237', 'teacher', 'M.Sc Chemistry', 'GCU Lahore', 'House 56, Faisal Town', '042-35678907', '0306-7890123', '1986-11-30', '2020-01-05', 'Class 7', true),
('T0008-25HN', 'Hina', 'Noor', 'Muhammad Noor', '3520289012348', 'teacher', 'M.A Islamiyat', 'Punjab University', 'House 78, Wapda Town', '042-35678908', '0307-8901234', '1992-02-14', '2023-01-20', 'Class 8', true),
('T0009-25IK', 'Imran', 'Khan', 'Zahid Khan', '3520290123459', 'teacher', 'M.Sc Biology', 'University of Punjab', 'House 90, Allama Iqbal Town', '042-35678909', '0308-9012345', '1984-05-20', '2019-09-01', 'Class 9', true),
('T0010-25RB', 'Rabia', 'Bashir', 'Bashir Ahmed', '3520201234560', 'teacher', 'M.A History', 'Lahore College', 'Flat 45, Cavalry Ground', '042-35678910', '0309-0123456', '1993-08-12', '2023-08-15', 'Class 10', true),
('T0011-25KM', 'Kamran', 'Malik', 'Rashid Malik', '3520212345681', 'teacher', 'M.Sc Computer Science', 'FAST University', 'House 23, Canal View', '042-35678911', '0310-1234567', '1988-01-08', '2021-06-01', 'Class 11', true),
('T0012-25NF', 'Nadia', 'Farooq', 'Farooq Ahmed', '3520223456792', 'teacher', 'M.Com', 'Punjab University', 'House 67, Muslim Town', '042-35678912', '0311-2345678', '1990-10-22', '2022-09-10', 'Class 12', true),
('T0013-25SA', 'Sana', 'Ali', 'Ali Raza', '3520234567803', 'staff', 'B.Ed', 'Lahore College', 'House 45, Green Town', '042-35678913', '0312-3456789', '1995-03-30', '2023-02-01', NULL, true),
('T0014-25AB', 'Adnan', 'Baig', 'Tariq Baig', '3520245678914', 'staff', 'MBA', 'IBA Lahore', 'Apartment 8, Johar Town', '042-35678914', '0313-4567890', '1987-07-16', '2020-10-15', NULL, true);

-- Insert Parents with varied enrollment dates
INSERT INTO public.parents (parent_id, father_name, cnic, phone, phone_secondary, address, current_balance, total_charged, total_paid, created_at) VALUES
('P0001-25MA', 'Muhammad Ali', '3520211111111', '0321-1111111', '042-11111111', 'House 12, Block A, Township', 0, 0, 0, '2025-01-05'),
('P0002-25AS', 'Ahmad Shahzad', '3520222222222', '0322-2222222', '042-22222222', 'Flat 5, Garden Town', 0, 0, 0, '2025-01-10'),
('P0003-25UK', 'Usman Khan', '3520233333333', '0323-3333333', '042-33333333', 'House 34, Model Town', 0, 0, 0, '2025-01-15'),
('P0004-25FH', 'Fahad Hassan', '3520244444444', '0324-4444444', '042-44444444', 'House 56, Johar Town', 0, 0, 0, '2025-02-08'),
('P0005-25IA', 'Imran Ahmed', '3520255555555', '0325-5555555', '042-55555555', 'Apartment 23, DHA Phase 5', 0, 0, 0, '2025-02-20'),
('P0006-25NA', 'Nadeem Ahmad', '3520266666666', '0326-6666666', '042-66666666', 'House 78, Gulberg', 0, 0, 0, '2025-03-05'),
('P0007-25SA', 'Salman Akram', '3520277777777', '0327-7777777', '042-77777777', 'House 90, Faisal Town', 0, 0, 0, '2025-03-18'),
('P0008-25KM', 'Kashif Mahmood', '3520288888888', '0328-8888888', '042-88888888', 'Flat 12, Cavalry Ground', 0, 0, 0, '2025-04-12'),
('P0009-25WA', 'Waseem Anwar', '3520299999999', '0329-9999999', '042-99999999', 'House 45, Wapda Town', 0, 0, 0, '2025-04-25'),
('P0010-25RK', 'Rehan Khan', '3520210101010', '0330-1010101', '042-10101010', 'House 67, Allama Iqbal Town', 0, 0, 0, '2025-05-10'),
('P0011-25TA', 'Tariq Aziz', '3520212121212', '0331-1212121', '042-12121212', 'House 23, Canal Road', 0, 0, 0, '2025-05-22'),
('P0012-25ZI', 'Zaheer Iqbal', '3520213131313', '0332-1313131', '042-13131313', 'Flat 34, Green Town', 0, 0, 0, '2025-06-08'),
('P0013-25MA', 'Mansoor Ali', '3520214141414', '0333-1414141', '042-14141414', 'House 56, Muslim Town', 0, 0, 0, '2025-06-20'),
('P0014-25AR', 'Asif Raza', '3520215151515', '0334-1515151', '042-15151515', 'House 78, Bahria Town', 0, 0, 0, '2025-07-15'),
('P0015-25FS', 'Farhan Shah', '3520216161616', '0335-1616161', '042-16161616', 'Apartment 90, Lake City', 0, 0, 0, '2025-07-28'),
('P0016-24HU', 'Hamza Usman', '3520217171717', '0336-1717171', '042-17171717', 'House 12, Valencia Town', 0, 0, 0, '2024-08-10'),
('P0017-24IH', 'Ibrahim Hussain', '3520218181818', '0337-1818181', '042-18181818', 'House 34, Paragon City', 0, 0, 0, '2024-09-05');

-- Insert Students distributed across all classes
INSERT INTO public.students (student_id, name, date_of_birth, cnic, class, monthly_fee, roll_number, date_of_admission, parent_id, is_active) VALUES
('S0001-25AA', 'Ali Ahmed', '2020-05-10', NULL, 'Playgroup', 2000, 'PG-001', '2025-01-05', (SELECT id FROM parents WHERE parent_id = 'P0001-25MA'), true),
('S0002-25FZ', 'Fatima Zahra', '2020-08-15', NULL, 'Playgroup', 2000, 'PG-002', '2025-02-08', (SELECT id FROM parents WHERE parent_id = 'P0004-25FH'), true),
('S0003-25ZK', 'Zain Khan', '2019-11-20', NULL, 'Nursery', 2000, 'NUR-001', '2025-01-10', (SELECT id FROM parents WHERE parent_id = 'P0002-25AS'), true),
('S0004-25MF', 'Maryam Fatima', '2019-07-25', NULL, 'Nursery', 2000, 'NUR-002', '2025-03-05', (SELECT id FROM parents WHERE parent_id = 'P0006-25NA'), true),
('S0005-25AH', 'Ahmad Hassan', '2018-12-15', NULL, 'KG', 2000, 'KG-001', '2025-01-15', (SELECT id FROM parents WHERE parent_id = 'P0003-25UK'), true),
('S0006-25SN', 'Sara Noor', '2019-02-20', NULL, 'KG', 2000, 'KG-002', '2025-04-12', (SELECT id FROM parents WHERE parent_id = 'P0008-25KM'), true),
('S0007-25UF', 'Usman Farooq', '2018-06-10', NULL, 'Class 1', 2000, '1-001', '2025-02-20', (SELECT id FROM parents WHERE parent_id = 'P0005-25IA'), true),
('S0008-25HB', 'Hiba Bilal', '2018-09-05', NULL, 'Class 1', 2000, '1-002', '2025-05-10', (SELECT id FROM parents WHERE parent_id = 'P0010-25RK'), true),
('S0009-25IA', 'Ibrahim Ali', '2017-10-18', NULL, 'Class 2', 2000, '2-001', '2025-03-18', (SELECT id FROM parents WHERE parent_id = 'P0007-25SA'), true),
('S0010-25AK', 'Aisha Khalid', '2017-12-22', NULL, 'Class 2', 2000, '2-002', '2025-06-08', (SELECT id FROM parents WHERE parent_id = 'P0012-25ZI'), true),
('S0011-25MU', 'Muhammad Umar', '2016-08-14', NULL, 'Class 3', 2000, '3-001', '2025-04-25', (SELECT id FROM parents WHERE parent_id = 'P0009-25WA'), true),
('S0012-25AR', 'Aliza Rehman', '2016-11-30', NULL, 'Class 3', 2000, '3-002', '2025-07-15', (SELECT id FROM parents WHERE parent_id = 'P0014-25AR'), true),
('S0013-25HS', 'Hassan Shafiq', '2015-07-08', NULL, 'Class 4', 2500, '4-001', '2025-05-22', (SELECT id FROM parents WHERE parent_id = 'P0011-25TA'), true),
('S0014-25RA', 'Rida Amjad', '2015-09-20', NULL, 'Class 4', 2500, '4-002', '2024-08-10', (SELECT id FROM parents WHERE parent_id = 'P0016-24HU'), true),
('S0015-25AS', 'Abdullah Saeed', '2014-06-12', NULL, 'Class 5', 2500, '5-001', '2025-06-20', (SELECT id FROM parents WHERE parent_id = 'P0013-25MA'), true),
('S0016-25ZF', 'Zara Faisal', '2014-10-25', NULL, 'Class 5', 2500, '5-002', '2024-09-05', (SELECT id FROM parents WHERE parent_id = 'P0017-24IH'), true),
('S0017-25MN', 'Muhammad Noman', '2013-05-18', '3520219191919', 'Class 6', 2500, '6-001', '2025-07-28', (SELECT id FROM parents WHERE parent_id = 'P0015-25FS'), true),
('S0018-25FM', 'Farah Malik', '2013-08-22', '3520220202020', 'Class 6', 2500, '6-002', '2024-08-10', (SELECT id FROM parents WHERE parent_id = 'P0016-24HU'), true),
('S0019-25YK', 'Yousuf Khalil', '2012-04-15', '3520221212121', 'Class 7', 2500, '7-001', '2024-09-05', (SELECT id FROM parents WHERE parent_id = 'P0017-24IH'), true),
('S0020-25SZ', 'Sana Zubair', '2012-07-30', '3520222222232', 'Class 7', 2500, '7-002', '2025-01-05', (SELECT id FROM parents WHERE parent_id = 'P0001-25MA'), true),
('S0021-25WR', 'Waleed Rashid', '2011-03-10', '3520223232323', 'Class 8', 3000, '8-001', '2025-02-08', (SELECT id FROM parents WHERE parent_id = 'P0004-25FH'), true),
('S0022-25MR', 'Madiha Rizwan', '2011-06-18', '3520224242424', 'Class 8', 3000, '8-002', '2025-03-05', (SELECT id FROM parents WHERE parent_id = 'P0006-25NA'), true),
('S0023-25AI', 'Ammar Imran', '2010-02-08', '3520225252525', 'Class 9', 3000, '9-001', '2025-04-12', (SELECT id FROM parents WHERE parent_id = 'P0008-25KM'), true),
('S0024-25HN', 'Hina Nasir', '2010-05-22', '3520226262626', 'Class 9', 3000, '9-002', '2025-05-10', (SELECT id FROM parents WHERE parent_id = 'P0010-25RK'), true),
('S0025-25FA', 'Faizan Arshad', '2009-01-12', '3520227272727', 'Class 10', 3000, '10-001', '2025-06-08', (SELECT id FROM parents WHERE parent_id = 'P0012-25ZI'), true),
('S0026-25NK', 'Nimra Kamran', '2009-04-28', '3520228282828', 'Class 10', 3000, '10-002', '2025-07-15', (SELECT id FROM parents WHERE parent_id = 'P0014-25AR'), true),
('S0027-25TM', 'Talha Mahmood', '2008-12-05', '3520229292929', 'Class 11', 5000, '11-001', '2024-08-10', (SELECT id FROM parents WHERE parent_id = 'P0016-24HU'), true),
('S0028-25AA', 'Amna Akram', '2008-11-15', '3520230303030', 'Class 11', 5000, '11-002', '2024-09-05', (SELECT id FROM parents WHERE parent_id = 'P0017-24IH'), true),
('S0029-25SA', 'Saad Ahmed', '2007-10-20', '3520231313131', 'Class 12', 5000, '12-001', '2025-01-10', (SELECT id FROM parents WHERE parent_id = 'P0002-25AS'), true),
('S0030-25LH', 'Laiba Hassan', '2007-09-12', '3520232323232', 'Class 12', 5000, '12-002', '2025-03-18', (SELECT id FROM parents WHERE parent_id = 'P0007-25SA'), true),
('S0031-25MS', 'Maria Shahzad', '2018-03-25', NULL, 'Class 1', 2000, '1-003', '2025-01-10', (SELECT id FROM parents WHERE parent_id = 'P0002-25AS'), true),
('S0032-25YA', 'Yasir Ali', '2019-06-10', NULL, 'Nursery', 2000, 'NUR-003', '2025-01-05', (SELECT id FROM parents WHERE parent_id = 'P0001-25MA'), true);

-- Insert Student Concessions
INSERT INTO public.student_concessions (student_id, category_id, discount_type, discount_value, valid_from, notes) VALUES
((SELECT id FROM students WHERE student_id = 'S0004-25MF'), '2cbcbb12-ac05-41cc-a206-df88bfdbba44', 'percentage', 50, '2025-03-05', 'Full orphan discount'),
((SELECT id FROM students WHERE student_id = 'S0012-25AR'), '2cbcbb12-ac05-41cc-a206-df88bfdbba44', 'percentage', 50, '2025-07-15', 'Full orphan discount'),
((SELECT id FROM students WHERE student_id = 'S0016-25ZF'), 'a8df64f7-8bb8-4c74-a1dd-d723cb69a7c9', 'percentage', 30, '2024-09-05', 'Teacher child discount'),
((SELECT id FROM students WHERE student_id = 'S0019-25YK'), '182e5399-e87d-4c47-9dc1-34485b47efe3', 'percentage', 20, '2024-09-05', 'Hifz student discount'),
((SELECT id FROM students WHERE student_id = 'S0027-25TM'), '182e5399-e87d-4c47-9dc1-34485b47efe3', 'percentage', 20, '2024-08-10', 'Hifz student discount'),
((SELECT id FROM students WHERE student_id = 'S0024-25HN'), '23179001-b4e4-4d60-a0cc-21d8d6c25c8e', 'fixed_amount', 500, '2025-05-10', 'Staff child concession');

-- Insert Sibling Discounts
INSERT INTO public.sibling_discounts (parent_id, applies_to_child_number, discount_type, discount_value, is_active) VALUES
((SELECT id FROM parents WHERE parent_id = 'P0001-25MA'), 2, 'percentage', 10, true),
((SELECT id FROM parents WHERE parent_id = 'P0002-25AS'), 2, 'percentage', 10, true),
((SELECT id FROM parents WHERE parent_id = 'P0016-24HU'), 2, 'percentage', 15, true);

-- Insert Fee Payments (using valid payment methods: cash and bank_transfer)
INSERT INTO public.fee_payments (student_id, parent_id, month, payment_year, amount_paid, base_fee, individual_discount, sibling_discount, total_discount, net_amount, payment_date, payment_method, receipt_number, notes) VALUES
((SELECT id FROM students WHERE student_id = 'S0014-25RA'), (SELECT id FROM parents WHERE parent_id = 'P0016-24HU'), 'August', 2024, 2500, 2500, 0, 0, 0, 2500, '2024-08-15', 'cash', 'R2024-000001', 'August 2024 fee'),
((SELECT id FROM students WHERE student_id = 'S0014-25RA'), (SELECT id FROM parents WHERE parent_id = 'P0016-24HU'), 'September', 2024, 2500, 2500, 0, 0, 0, 2500, '2024-09-10', 'cash', 'R2024-000002', 'September 2024 fee'),
((SELECT id FROM students WHERE student_id = 'S0014-25RA'), (SELECT id FROM parents WHERE parent_id = 'P0016-24HU'), 'October', 2024, 2125, 2500, 0, 375, 375, 2125, '2024-10-08', 'bank_transfer', 'R2024-000003', 'October 2024 fee with sibling discount'),
((SELECT id FROM students WHERE student_id = 'S0016-25ZF'), (SELECT id FROM parents WHERE parent_id = 'P0017-24IH'), 'September', 2024, 1750, 2500, 750, 0, 750, 1750, '2024-09-12', 'cash', 'R2024-000004', 'September 2024 fee with teacher discount'),
((SELECT id FROM students WHERE student_id = 'S0016-25ZF'), (SELECT id FROM parents WHERE parent_id = 'P0017-24IH'), 'October', 2024, 1750, 2500, 750, 0, 750, 1750, '2024-10-10', 'cash', 'R2024-000005', 'October 2024 fee'),
((SELECT id FROM students WHERE student_id = 'S0018-25FM'), (SELECT id FROM parents WHERE parent_id = 'P0016-24HU'), 'October', 2024, 2125, 2500, 0, 375, 375, 2125, '2024-10-08', 'bank_transfer', 'R2024-000006', 'October 2024 fee'),
((SELECT id FROM students WHERE student_id = 'S0027-25TM'), (SELECT id FROM parents WHERE parent_id = 'P0016-24HU'), 'August', 2024, 4000, 5000, 1000, 0, 1000, 4000, '2024-08-15', 'bank_transfer', 'R2024-000007', 'August 2024 with Hifz discount'),
((SELECT id FROM students WHERE student_id = 'S0027-25TM'), (SELECT id FROM parents WHERE parent_id = 'P0016-24HU'), 'September', 2024, 4000, 5000, 1000, 0, 1000, 4000, '2024-09-10', 'bank_transfer', 'R2024-000008', 'September 2024 with Hifz discount'),
((SELECT id FROM students WHERE student_id = 'S0019-25YK'), (SELECT id FROM parents WHERE parent_id = 'P0017-24IH'), 'September', 2024, 2000, 2500, 500, 0, 500, 2000, '2024-09-12', 'cash', 'R2024-000009', 'September 2024 with Hifz discount'),
((SELECT id FROM students WHERE student_id = 'S0019-25YK'), (SELECT id FROM parents WHERE parent_id = 'P0017-24IH'), 'October', 2024, 2000, 2500, 500, 0, 500, 2000, '2024-10-10', 'cash', 'R2024-000010', 'October 2024 with discount');

-- Insert Parent Transactions (using valid payment methods)
INSERT INTO public.parent_transactions (parent_id, transaction_type, amount, description, payment_method, transaction_date, notes) VALUES
((SELECT id FROM parents WHERE parent_id = 'P0001-25MA'), 'charge', 6000, 'Monthly fees for 2 children - January', NULL, '2025-01-05', 'Ali and Yasir - January 2025'),
((SELECT id FROM parents WHERE parent_id = 'P0002-25AS'), 'charge', 6000, 'Monthly fees for 2 children - January', NULL, '2025-01-10', 'Zain and Saad - January 2025'),
((SELECT id FROM parents WHERE parent_id = 'P0003-25UK'), 'charge', 2000, 'Monthly fee - January', NULL, '2025-01-15', 'Ahmad - January 2025'),
((SELECT id FROM parents WHERE parent_id = 'P0001-25MA'), 'payment', 6000, 'Payment for January fees', 'bank_transfer', '2025-01-08', 'Full payment for both children'),
((SELECT id FROM parents WHERE parent_id = 'P0002-25AS'), 'payment', 5000, 'Partial payment for January', 'cash', '2025-01-12', 'Partial payment - balance remaining'),
((SELECT id FROM parents WHERE parent_id = 'P0016-24HU'), 'charge', 9125, 'Monthly fees for 3 children - October', NULL, '2024-10-01', 'Hassan, Farah, Talha with discounts'),
((SELECT id FROM parents WHERE parent_id = 'P0016-24HU'), 'payment', 9125, 'Payment for October fees', 'bank_transfer', '2024-10-08', 'Full payment for all children'),
((SELECT id FROM parents WHERE parent_id = 'P0017-24IH'), 'charge', 3750, 'Monthly fees for 2 children - September', NULL, '2024-09-01', 'Zara and Yousuf with discounts'),
((SELECT id FROM parents WHERE parent_id = 'P0017-24IH'), 'payment', 3750, 'Payment for September fees', 'cash', '2024-09-12', 'Full payment');