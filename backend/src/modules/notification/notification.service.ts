import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { Notification } from './entities/notification.entity';
import { AppLoggerService } from '@common/logger/logger.service';
import { PaginationDto, PaginatedResponse } from '@common/dto';
import { NotificationType, NotificationStatus } from '@common/enums';

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.initializeMailer();
  }

  private initializeMailer(): void {
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASSWORD');

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.configService.get('SMTP_PORT') || 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      });
    }
  }

  async sendEmail(to: string, subject: string, body: string, userId?: string): Promise<Notification> {
    const notification = this.notificationRepository.create({
      type: NotificationType.EMAIL,
      recipientId: userId || 'system',
      recipientEmail: to,
      subject,
      body,
      status: NotificationStatus.PENDING,
    });

    await this.notificationRepository.save(notification);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.configService.get('SMTP_USER'),
          to,
          subject,
          html: body,
        });
        notification.status = NotificationStatus.SENT;
        notification.sentAt = new Date();
        this.logger.log(`Email sent to ${to}: ${subject}`, 'NotificationService');
      } catch (error) {
        notification.status = NotificationStatus.FAILED;
        notification.errorMessage = error.message;
        this.logger.error(`Failed to send email to ${to}: ${error.message}`, 'NotificationService');
      }
    } else {
      this.logger.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`, 'NotificationService');
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
    }

    await this.notificationRepository.save(notification);
    return notification;
  }

  async sendInAppNotification(userId: string, title: string, body: string): Promise<Notification> {
    const notification = this.notificationRepository.create({
      type: NotificationType.IN_APP,
      recipientId: userId,
      subject: title,
      body,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });

    return this.notificationRepository.save(notification);
  }

  async sendTokenConfirmation(userId: string, email: string, tokenData: any): Promise<void> {
    const subject = `Your Token: ${tokenData.tokenNumber}`;
    const body = `
      <h2>Token Confirmed - PublicDesk</h2>
      <p>Your digital token has been generated successfully.</p>
      <table>
        <tr><td><strong>Token Number:</strong></td><td>${tokenData.tokenNumber}</td></tr>
        <tr><td><strong>Office:</strong></td><td>${tokenData.officeName || 'N/A'}</td></tr>
        <tr><td><strong>Service:</strong></td><td>${tokenData.serviceName || 'N/A'}</td></tr>
        <tr><td><strong>Est. Wait Time:</strong></td><td>${tokenData.estimatedWaitTime || 'N/A'} minutes</td></tr>
      </table>
      <p>Please be present when your token is called. Show this email or your QR code at the counter.</p>
    `;

    await this.sendEmail(email, subject, body, userId);
    await this.sendInAppNotification(userId, subject, `Token ${tokenData.tokenNumber} is ready. Est. wait: ${tokenData.estimatedWaitTime} mins`);
  }

  async sendTokenCalled(userId: string, email: string, tokenNumber: string, counterNumber: number): Promise<void> {
    const subject = `Token ${tokenNumber} - Please proceed to Counter ${counterNumber}`;
    const body = `
      <h2>Your Token is Called!</h2>
      <p>Token <strong>${tokenNumber}</strong> is now being called.</p>
      <p>Please proceed to <strong>Counter ${counterNumber}</strong> immediately.</p>
      <p>If you do not appear within 5 minutes, your token will be marked as no-show.</p>
    `;

    await this.sendEmail(email, subject, body, userId);
    await this.sendInAppNotification(userId, `Token ${tokenNumber} Called`, `Please proceed to Counter ${counterNumber} now!`);
  }

  async sendAppointmentConfirmation(userId: string, email: string, appointmentData: any): Promise<void> {
    const subject = `Appointment Confirmed: ${appointmentData.appointmentNumber}`;
    const body = `
      <h2>Appointment Confirmed - PublicDesk</h2>
      <p>Your appointment has been booked successfully.</p>
      <table>
        <tr><td><strong>Reference:</strong></td><td>${appointmentData.appointmentNumber}</td></tr>
        <tr><td><strong>Service:</strong></td><td>${appointmentData.serviceName || 'N/A'}</td></tr>
        <tr><td><strong>Office:</strong></td><td>${appointmentData.officeName || 'N/A'}</td></tr>
        <tr><td><strong>Date:</strong></td><td>${appointmentData.scheduledDate}</td></tr>
        <tr><td><strong>Time:</strong></td><td>${appointmentData.scheduledTime}</td></tr>
      </table>
      <p>Please arrive 10 minutes before your scheduled time.</p>
    `;

    await this.sendEmail(email, subject, body, userId);
  }

  async sendAppointmentCancellation(userId: string, email: string, appointmentData: any, reason?: string): Promise<void> {
    const subject = `Appointment Cancelled: ${appointmentData.appointmentNumber}`;
    const body = `
      <h2>Appointment Cancelled - PublicDesk</h2>
      <p>Your appointment <strong>${appointmentData.appointmentNumber}</strong> has been cancelled.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>You can book a new appointment at any time.</p>
    `;

    await this.sendEmail(email, subject, body, userId);
  }

  async getNotifications(userId: string, paginationDto: PaginationDto): Promise<PaginatedResponse<Notification>> {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.notificationRepository.findAndCount({
      where: { recipientId: userId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (notification) {
      notification.status = NotificationStatus.DELIVERED;
      notification.deliveredAt = new Date();
      await this.notificationRepository.save(notification);
    }
    return notification!;
  }

  async getAllNotifications(paginationDto: PaginationDto): Promise<PaginatedResponse<Notification>> {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.notificationRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
