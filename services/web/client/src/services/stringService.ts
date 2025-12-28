class stringService {
  getInitials(name: string): string {
    const names = name.split(" ");
    let initials = "";
    if (names.length > 0) {
      initials += names[0].charAt(0).toUpperCase();
    }
    if (names.length > 1) {
      initials += names[1].charAt(0).toUpperCase();
    }
    return initials;
  }
}

export default new stringService();
