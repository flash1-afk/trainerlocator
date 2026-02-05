const sendEmail = async (to, subject, text, html) => {
    // In a real application, you would use Nodemailer with an SMTP transport here.
    // Example: SendGrid, Mailgun, or Gmail.

    console.log('---------------------------------------------------------');
    console.log(`📧 [MOCK EMAIL SERVICE] Sending email to: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    console.log(`📄 Content: ${text}`);
    console.log('---------------------------------------------------------');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return true;
};

const sendBookingNotificationToTrainer = async (trainerEmail, trainerName, studentName, sessionType, date) => {
    const subject = 'New Booking Request - TrainrLocator';
    const text = `Hello ${trainerName},\n\nYou have a new booking request from ${studentName} for a ${sessionType} session on ${date}.\n\nPlease log in to your dashboard to view and manage this request.\n\nBest regards,\nTrainrLocator Team`;

    return sendEmail(trainerEmail, subject, text);
};

const sendBookingConfirmationToStudent = async (studentEmail, studentName, trainerName, sessionType, date) => {
    const subject = 'Booking Confirmation - TrainrLocator';
    const text = `Hello ${studentName},\n\nYour booking request for a ${sessionType} session with ${trainerName} on ${date} has been successfully sent.\n\nYou will receive another notification once the trainer confirms your session.\n\nBest regards,\nTrainrLocator Team`;

    return sendEmail(studentEmail, subject, text);
};

module.exports = {
    sendEmail,
    sendBookingNotificationToTrainer,
    sendBookingConfirmationToStudent
};
