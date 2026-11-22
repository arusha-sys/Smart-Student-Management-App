// MVC Model: User Base Class
class User {
  constructor({ id, name, email, password, role, phone, address, is_blocked = 0, created_at }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
    this.phone = phone;
    this.address = address;
    this.is_blocked = is_blocked ? 1 : 0;
    this.created_at = created_at;
  }

  isBlocked() {
    return this.is_blocked === 1;
  }

  getSafeProfile() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      phone: this.phone,
      address: this.address,
      is_blocked: this.is_blocked,
      created_at: this.created_at
    };
  }
}

module.exports = User;
