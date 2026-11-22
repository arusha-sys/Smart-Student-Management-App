const NotificationSubject = require('./NotificationSubject');
const StudentNotifier = require('./StudentNotifier');
const TeacherNotifier = require('./TeacherNotifier');
const EmailLogObserver = require('./EmailLogObserver');

const defaultSubject = new NotificationSubject();
const studentNotifier = new StudentNotifier();
const teacherNotifier = new TeacherNotifier();
const emailLogObserver = new EmailLogObserver();

defaultSubject.attach(studentNotifier);
defaultSubject.attach(teacherNotifier);
defaultSubject.attach(emailLogObserver);

module.exports = {
  NotificationSubject,
  StudentNotifier,
  TeacherNotifier,
  EmailLogObserver,
  notificationDispatcher: defaultSubject
};
