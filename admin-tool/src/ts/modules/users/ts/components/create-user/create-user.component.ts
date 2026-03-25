import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateUserService } from '@admin-tool-services/create-user.service';
import { UsersService } from '@admin-tool-services/users.service';

/**
 * Modal component for creating a new user.
 * Controlled by the parent via the `visible` input.
 * Emits `onClose` when the modal is dismissed and `onSuccess` when a user is created successfully.
 */
@Component({
  selector: 'create-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.less'
})
export class CreateUserComponent {

  @Input() visible = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSuccess = new EventEmitter<void>();

  loading = false;
  errors: any = {};

  model = {
    username: '',
    fullname: '',
    email: '',
    phone: '',
    roles: [] as string[],
    password: '',
    passwordConfirm: '',
    showPassword: false,
  };

  // Mock roles hasta tener acceso a settings
  availableRoles = [
    { key: 'chw', label: 'Community Health Worker' },
    { key: 'chw_supervisor', label: 'CHW Supervisor' },
    { key: 'national_admin', label: 'National Admin' },
  ];

  constructor(
    private createUserService: CreateUserService,
    private usersService: UsersService
  ) {}

  /**
   * Closes the modal and resets the form.
   */
  cancel() {
    this.reset();
    this.onClose.emit();
  }

  /**
   * Toggles password field visibility between plain text and masked.
   */
  togglePassword() {
    this.model.showPassword = !this.model.showPassword;
  }

  /**
   * Toggles a role selection on or off.
   * @param key the role key to toggle
   */
  toggleRole(key: string) {
    const index = this.model.roles.indexOf(key);
    if (index === -1) {
      this.model.roles.push(key);
    } else {
      this.model.roles.splice(index, 1);
    }
  }

  /**
   * Validates the form fields and populates the errors object.
   * @returns true if the form is valid, false otherwise
   */
  private validate() {
    this.errors = {};
    const usernameRegex = /^[a-z0-9_-]+$/;

    if (!this.model.username) {
      this.errors.username = 'Username is required';
    } else if (!usernameRegex.test(this.model.username)) {
      this.errors.username = 'Username can only contain lowercase letters, digits, hyphens and underscores';
    }

    if (this.model.email && !/^[^\s@]+@[^\s@]+$/.test(this.model.email)) {
      this.errors.email = 'Email must match the format something@something';
    }

    if (!this.model.roles.length) {
      this.errors.roles = 'At least one role is required';
    }

    if (!this.model.password) {
      this.errors.password = 'Password is required';
    } else if (this.model.password.length < 8) {
      this.errors.password = 'Password must be at least 8 characters';
    }

    if (!this.model.passwordConfirm) {
      this.errors.passwordConfirm = 'Please confirm your password';
    } else if (this.model.password !== this.model.passwordConfirm) {
      this.errors.passwordConfirm = 'Passwords do not match';
    }

    return Object.keys(this.errors).length === 0;
  }

  /**
   * Resets the form model and errors to their initial state.
   */
  private reset() {
    this.model = {
      username: '',
      fullname: '',
      email: '',
      phone: '',
      roles: [],
      password: '',
      passwordConfirm: '',
      showPassword: false,
    };
    this.errors = {};
    this.loading = false;
  }

  /**
   * Validates and submits the form to create a new user.
   * On success notifies the users service and closes the modal.
   * On error displays the error message inside the modal.
   */
  async submit() {
    if (!this.validate()) {
      return;
    }

    this.loading = true;
    try {
      await this.createUserService.createUser({
        username: this.model.username,
        fullname: this.model.fullname,
        email: this.model.email,
        phone: this.model.phone,
        roles: this.model.roles,
        password: this.model.password,
      });
      this.usersService.notifyUsersUpdated();
      this.reset();
      this.onSuccess.emit();
      this.onClose.emit();
    } catch (err: any) {
      this.errors.submit = err?.error?.message || 'Error creating user';
    } finally {
      this.loading = false;
    }
  }
}
