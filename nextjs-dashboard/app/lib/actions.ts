"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import postgres from "postgres";
import { redirect } from "next/navigation";
import { error } from "console";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  data: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, data: true });
const UpdateInvoice = FormSchema.omit({ id: true, data: true });

export async function createInvoice(formData: FormData) {
  // const { customerId, amount, status } = CreateInvoice.parse({
  //   customerId: formData.get("customerId"),
  //   amount: formData.get("amount"),
  //   status: formData.get("status"),
  // });
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
      message: "Missing fields. Failed to Create Invoice",
    };
  }

  const { customerId, amount, status } = validatedFields.data;

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
  INSERT INTO INVOICES (customer_id, amount, status, date)
  VALUES (${customerId},${amountInCents}, ${status},  ${date})
  `;
  } catch (error) {
    console.log(error);
    return {
      message: "Failed to Create Invoice",
      error: error,
    };
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string, formData: FormData) {
  // const { customerId, amount, status } = UpdateInvoice.parse({
  //   customerId: formData.get("customerId"),
  //   amount: formData.get("amount"),
  //   status: formData.get("status"),
  // });

  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
      message: "Missing fields. Failed to Create Invoice",
    };
  }

  const { customerId, amount, status } = validatedFields.data;

  const amountInCents = amount * 100;
  try {
    await sql`
  UPDATE INVOICES
  SET
    customer_id = ${customerId},
    amount = ${amountInCents},
    status = ${status}
  WHERE id = ${id}
  `;
  } catch (error) {
    console.log(error);
    return {
      message: "Database Error: Failed to Update Invoice",
      error: error,
    };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  // throw new Error("Failed to Delete Invoice");

  try {
    await sql`
  DELETE FROM INVOICES WHERE id = ${id}
  `;
  } catch (error) {
    console.log(error);
    return {
      message: `Failed to Delete Invoice`,
      error: error,
    };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
