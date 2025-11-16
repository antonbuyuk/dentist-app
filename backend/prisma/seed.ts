import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных тестовыми данными...');

  // Очищаем существующие данные
  console.log('🗑️  Очищаем существующие данные...');
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();

  // Создаём врачей
  console.log('👨‍⚕️  Создаём врачей...');
  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        firstName: 'Иван',
        lastName: 'Петров',
        specialization: 'Терапевтическая стоматология',
        email: 'ivan.petrov@dentist.ru',
        phone: '+7 (495) 123-45-67',
      },
    }),
    prisma.doctor.create({
      data: {
        firstName: 'Мария',
        lastName: 'Сидорова',
        specialization: 'Хирургическая стоматология',
        email: 'maria.sidorova@dentist.ru',
        phone: '+7 (495) 123-45-68',
      },
    }),
    prisma.doctor.create({
      data: {
        firstName: 'Александр',
        lastName: 'Козлов',
        specialization: 'Ортодонтия',
        email: 'alexander.kozlov@dentist.ru',
        phone: '+7 (495) 123-45-69',
      },
    }),
    prisma.doctor.create({
      data: {
        firstName: 'Елена',
        lastName: 'Новикова',
        specialization: 'Детская стоматология',
        email: 'elena.novikova@dentist.ru',
        phone: '+7 (495) 123-45-70',
      },
    }),
    prisma.doctor.create({
      data: {
        firstName: 'Дмитрий',
        lastName: 'Морозов',
        specialization: 'Протезирование',
        email: 'dmitry.morozov@dentist.ru',
        phone: '+7 (495) 123-45-71',
      },
    }),
  ]);

  console.log(`✅ Создано ${doctors.length} врачей`);

  // Создаём пациентов
  console.log('👥 Создаём пациентов...');
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        firstName: 'Анна',
        lastName: 'Иванова',
        email: 'anna.ivanova@example.com',
        phone: '+7 (999) 111-22-33',
        dateOfBirth: new Date('1990-05-15'),
        address: 'г. Москва, ул. Ленина, д. 10, кв. 25',
        notes: 'Аллергия на пенициллин',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Сергей',
        lastName: 'Смирнов',
        email: 'sergey.smirnov@example.com',
        phone: '+7 (999) 222-33-44',
        dateOfBirth: new Date('1985-08-20'),
        address: 'г. Москва, пр. Мира, д. 5, кв. 12',
        notes: 'Регулярный пациент',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Ольга',
        lastName: 'Кузнецова',
        email: 'olga.kuznetsova@example.com',
        phone: '+7 (999) 333-44-55',
        dateOfBirth: new Date('1992-12-03'),
        address: 'г. Москва, ул. Пушкина, д. 15, кв. 8',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Михаил',
        lastName: 'Попов',
        email: 'mikhail.popov@example.com',
        phone: '+7 (999) 444-55-66',
        dateOfBirth: new Date('1988-03-25'),
        address: 'г. Москва, ул. Гагарина, д. 20, кв. 45',
        notes: 'Требуется консультация ортодонта',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Екатерина',
        lastName: 'Васильева',
        email: 'ekaterina.vasilieva@example.com',
        phone: '+7 (999) 555-66-77',
        dateOfBirth: new Date('1995-07-10'),
        address: 'г. Москва, ул. Чехова, д. 7, кв. 30',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Андрей',
        lastName: 'Соколов',
        email: 'andrey.sokolov@example.com',
        phone: '+7 (999) 666-77-88',
        dateOfBirth: new Date('1983-11-18'),
        address: 'г. Москва, ул. Толстого, д. 12, кв. 15',
        notes: 'Боится стоматологов, требуется деликатный подход',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Татьяна',
        lastName: 'Михайлова',
        email: 'tatiana.mikhailova@example.com',
        phone: '+7 (999) 777-88-99',
        dateOfBirth: new Date('1991-09-22'),
        address: 'г. Москва, ул. Достоевского, д. 3, кв. 22',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Владимир',
        lastName: 'Фёдоров',
        email: 'vladimir.fedorov@example.com',
        phone: '+7 (999) 888-99-00',
        dateOfBirth: new Date('1987-04-14'),
        address: 'г. Москва, ул. Тургенева, д. 9, кв. 18',
        notes: 'Регулярное профилактическое обслуживание',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Наталья',
        lastName: 'Морозова',
        email: 'natalya.morozova@example.com',
        phone: '+7 (999) 999-00-11',
        dateOfBirth: new Date('1993-06-30'),
        address: 'г. Москва, ул. Некрасова, д. 14, кв. 33',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Павел',
        lastName: 'Волков',
        email: 'pavel.volkov@example.com',
        phone: '+7 (999) 000-11-22',
        dateOfBirth: new Date('1989-01-08'),
        address: 'г. Москва, ул. Гоголя, д. 6, кв. 11',
        notes: 'Требуется имплантация',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Юлия',
        lastName: 'Алексеева',
        email: 'yulia.alexeeva@example.com',
        phone: '+7 (999) 111-22-33',
        dateOfBirth: new Date('1994-10-05'),
        address: 'г. Москва, ул. Булгакова, д. 18, кв. 27',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Игорь',
        lastName: 'Лебедев',
        email: 'igor.lebedev@example.com',
        phone: '+7 (999) 222-33-44',
        dateOfBirth: new Date('1986-02-19'),
        address: 'г. Москва, ул. Шолохова, д. 11, кв. 9',
        notes: 'Сложный случай, требуется консилиум',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Светлана',
        lastName: 'Семёнова',
        email: 'svetlana.semenova@example.com',
        phone: '+7 (999) 333-44-55',
        dateOfBirth: new Date('1990-08-12'),
        address: 'г. Москва, ул. Островского, д. 4, кв. 16',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Роман',
        lastName: 'Егоров',
        email: 'roman.egorov@example.com',
        phone: '+7 (999) 444-55-66',
        dateOfBirth: new Date('1992-12-28'),
        address: 'г. Москва, ул. Маяковского, д. 13, кв. 21',
        notes: 'Регулярный пациент, хорошая гигиена',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Марина',
        lastName: 'Павлова',
        email: 'marina.pavlova@example.com',
        phone: '+7 (999) 555-66-77',
        dateOfBirth: new Date('1984-05-07'),
        address: 'г. Москва, ул. Есенина, д. 2, кв. 14',
      },
    }),
  ]);

  console.log(`✅ Создано ${patients.length} пациентов`);

  // Создаём приёмы
  console.log('📅 Создаём приёмы...');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const appointments = await Promise.all([
    // Сегодня
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctors[0].id,
        startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 09:00
        endTime: new Date(today.getTime() + 9.5 * 60 * 60 * 1000), // 09:30
        notes: 'Плановый осмотр',
        status: 'scheduled',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        doctorId: doctors[0].id,
        startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00
        endTime: new Date(today.getTime() + 10.5 * 60 * 60 * 1000), // 10:30
        status: 'scheduled',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        doctorId: doctors[1].id,
        startTime: new Date(today.getTime() + 11 * 60 * 60 * 1000), // 11:00
        endTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00
        notes: 'Удаление зуба',
        status: 'scheduled',
      },
    }),
    // Завтра
    prisma.appointment.create({
      data: {
        patientId: patients[3].id,
        doctorId: doctors[2].id,
        startTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // Завтра 14:00
        endTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), // Завтра 15:00
        notes: 'Консультация по брекетам',
        status: 'scheduled',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[4].id,
        doctorId: doctors[3].id,
        startTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // Завтра 10:00
        endTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // Завтра 11:00
        status: 'scheduled',
      },
    }),
    // Послезавтра
    prisma.appointment.create({
      data: {
        patientId: patients[5].id,
        doctorId: doctors[4].id,
        startTime: new Date(today.getTime() + 48 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), // Послезавтра 13:00
        endTime: new Date(today.getTime() + 48 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // Послезавтра 14:00
        notes: 'Установка протеза',
        status: 'scheduled',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[6].id,
        doctorId: doctors[0].id,
        startTime: new Date(today.getTime() + 48 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), // Послезавтра 15:00
        endTime: new Date(today.getTime() + 48 * 60 * 60 * 1000 + 15.5 * 60 * 60 * 1000), // Послезавтра 15:30
        status: 'scheduled',
      },
    }),
    // На следующей неделе
    prisma.appointment.create({
      data: {
        patientId: patients[7].id,
        doctorId: doctors[1].id,
        startTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // Через неделю 09:00
        endTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // Через неделю 10:00
        status: 'scheduled',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[8].id,
        doctorId: doctors[2].id,
        startTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // Через неделю 11:00
        endTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), // Через неделю 12:00
        notes: 'Повторный приём',
        status: 'scheduled',
      },
    }),
  ]);

  console.log(`✅ Создано ${appointments.length} приёмов`);

  console.log('\n✨ База данных успешно заполнена тестовыми данными!');
  console.log(`📊 Статистика:`);
  console.log(`   - Врачей: ${doctors.length}`);
  console.log(`   - Пациентов: ${patients.length}`);
  console.log(`   - Приёмов: ${appointments.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

