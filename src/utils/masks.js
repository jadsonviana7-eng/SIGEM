export function formatCPF(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  let res = "";
  if (digits.length > 0) res += digits.slice(0, 3);
  if (digits.length > 3) res += "." + digits.slice(3, 6);
  if (digits.length > 6) res += "." + digits.slice(6, 9);
  if (digits.length > 9) res += "-" + digits.slice(9, 11);
  return res;
}

export function formatCNPJ(value) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  let res = "";
  if (digits.length > 0) res += digits.slice(0, 2);
  if (digits.length > 2) res += "." + digits.slice(2, 5);
  if (digits.length > 5) res += "." + digits.slice(5, 8);
  if (digits.length > 8) res += "/" + digits.slice(8, 12);
  if (digits.length > 12) res += "-" + digits.slice(12, 14);
  return res;
}

export function formatTelefone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  let res = "";
  if (digits.length > 0) {
    const ddd = digits.slice(0, 2);
    res += `(${ddd}`;
    if (digits.length > 2) {
      res += ") ";
      const rest = digits.slice(2);
      if (rest.length > 8) {
        res += rest.slice(0, 5) + "-" + rest.slice(5, 9);
      } else {
        if (rest.length > 4) {
          res += rest.slice(0, 4) + "-" + rest.slice(4, 8);
        } else {
          res += rest;
        }
      }
    }
  }
  return res;
}

export function formatData(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  let res = "";
  if (digits.length > 0) res += digits.slice(0, 2);
  if (digits.length > 2) res += "/" + digits.slice(2, 4);
  if (digits.length > 4) res += "/" + digits.slice(4, 8);
  return res;
}

export function formatSUS(value) {
  const digits = value.replace(/\D/g, "").slice(0, 15);
  let res = "";
  if (digits.length > 0) res += digits.slice(0, 3);
  if (digits.length > 3) res += "." + digits.slice(3, 7);
  if (digits.length > 7) res += "." + digits.slice(7, 11);
  if (digits.length > 11) res += "." + digits.slice(11, 15);
  return res;
}

export function formatCEP(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  let res = "";
  if (digits.length > 0) res += digits.slice(0, 5);
  if (digits.length > 5) res += "-" + digits.slice(5, 8);
  return res;
}

export function formatNIS(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  let res = "";
  if (digits.length > 0) res += digits.slice(0, 3);
  if (digits.length > 3) res += "." + digits.slice(3, 8);
  if (digits.length > 8) res += "." + digits.slice(8, 10);
  if (digits.length > 10) res += "-" + digits.slice(10, 11);
  return res;
}
