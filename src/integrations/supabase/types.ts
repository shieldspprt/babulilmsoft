export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: []
      }
      account_transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          description: string
          id: string
          notes: string | null
          paid_by: string | null
          payment_method: string
          receipt_number: string | null
          recorded_by: string | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          paid_by?: string | null
          payment_method: string
          receipt_number?: string | null
          recorded_by?: string | null
          transaction_date?: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          paid_by?: string | null
          payment_method?: string
          receipt_number?: string | null
          recorded_by?: string | null
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "account_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_writeoffs: {
        Row: {
          approved_by: string
          created_at: string
          id: string
          notes: string | null
          original_amount: number
          parent_id: string
          reason: string
          related_payment_id: string | null
          student_id: string | null
          writeoff_amount: number
          writeoff_date: string
          writeoff_type: string
        }
        Insert: {
          approved_by: string
          created_at?: string
          id?: string
          notes?: string | null
          original_amount: number
          parent_id: string
          reason: string
          related_payment_id?: string | null
          student_id?: string | null
          writeoff_amount: number
          writeoff_date?: string
          writeoff_type: string
        }
        Update: {
          approved_by?: string
          created_at?: string
          id?: string
          notes?: string | null
          original_amount?: number
          parent_id?: string
          reason?: string
          related_payment_id?: string | null
          student_id?: string | null
          writeoff_amount?: number
          writeoff_date?: string
          writeoff_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_writeoffs_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_writeoffs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      book_items: {
        Row: {
          class_name: string
          created_at: string
          created_by: string | null
          current_stock: number
          id: string
          is_active: boolean
          name: string
          selling_price: number
          syllabus_type_id: string
          unit_cost: number
        }
        Insert: {
          class_name: string
          created_at?: string
          created_by?: string | null
          current_stock?: number
          id?: string
          is_active?: boolean
          name: string
          selling_price?: number
          syllabus_type_id: string
          unit_cost?: number
        }
        Update: {
          class_name?: string
          created_at?: string
          created_by?: string | null
          current_stock?: number
          id?: string
          is_active?: boolean
          name?: string
          selling_price?: number
          syllabus_type_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "book_items_syllabus_type_id_fkey"
            columns: ["syllabus_type_id"]
            isOneToOne: false
            referencedRelation: "syllabus_types"
            referencedColumns: ["id"]
          },
        ]
      }
      book_sale_items: {
        Row: {
          book_item_id: string | null
          book_sale_id: string
          book_set_id: string | null
          created_at: string
          id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          book_item_id?: string | null
          book_sale_id: string
          book_set_id?: string | null
          created_at?: string
          id?: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          book_item_id?: string | null
          book_sale_id?: string
          book_set_id?: string | null
          created_at?: string
          id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "book_sale_items_book_item_id_fkey"
            columns: ["book_item_id"]
            isOneToOne: false
            referencedRelation: "book_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_sale_items_book_sale_id_fkey"
            columns: ["book_sale_id"]
            isOneToOne: false
            referencedRelation: "book_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_sale_items_book_set_id_fkey"
            columns: ["book_set_id"]
            isOneToOne: false
            referencedRelation: "book_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      book_sales: {
        Row: {
          account_transaction_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          parent_id: string | null
          payment_method: string
          sale_date: string
          sale_number: string
          student_id: string | null
          total_amount: number
        }
        Insert: {
          account_transaction_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          parent_id?: string | null
          payment_method: string
          sale_date?: string
          sale_number: string
          student_id?: string | null
          total_amount: number
        }
        Update: {
          account_transaction_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          parent_id?: string | null
          payment_method?: string
          sale_date?: string
          sale_number?: string
          student_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "book_sales_account_transaction_id_fkey"
            columns: ["account_transaction_id"]
            isOneToOne: false
            referencedRelation: "account_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_sales_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_sales_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      book_set_items: {
        Row: {
          book_item_id: string
          book_set_id: string
          created_at: string
          id: string
          quantity: number
        }
        Insert: {
          book_item_id: string
          book_set_id: string
          created_at?: string
          id?: string
          quantity?: number
        }
        Update: {
          book_item_id?: string
          book_set_id?: string
          created_at?: string
          id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "book_set_items_book_item_id_fkey"
            columns: ["book_item_id"]
            isOneToOne: false
            referencedRelation: "book_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_set_items_book_set_id_fkey"
            columns: ["book_set_id"]
            isOneToOne: false
            referencedRelation: "book_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      book_sets: {
        Row: {
          class_name: string
          created_at: string
          created_by: string | null
          current_stock: number
          id: string
          is_active: boolean
          name: string
          number_of_books: number
          set_price: number
          syllabus_type_id: string
          unit_cost: number
        }
        Insert: {
          class_name: string
          created_at?: string
          created_by?: string | null
          current_stock?: number
          id?: string
          is_active?: boolean
          name: string
          number_of_books?: number
          set_price?: number
          syllabus_type_id: string
          unit_cost?: number
        }
        Update: {
          class_name?: string
          created_at?: string
          created_by?: string | null
          current_stock?: number
          id?: string
          is_active?: boolean
          name?: string
          number_of_books?: number
          set_price?: number
          syllabus_type_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "book_sets_syllabus_type_id_fkey"
            columns: ["syllabus_type_id"]
            isOneToOne: false
            referencedRelation: "syllabus_types"
            referencedColumns: ["id"]
          },
        ]
      }
      book_stock_transactions: {
        Row: {
          book_item_id: string | null
          book_set_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          quantity: number
          supplier_transaction_id: string | null
          transaction_type: string
          unit_cost: number | null
        }
        Insert: {
          book_item_id?: string | null
          book_set_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          quantity: number
          supplier_transaction_id?: string | null
          transaction_type: string
          unit_cost?: number | null
        }
        Update: {
          book_item_id?: string | null
          book_set_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          supplier_transaction_id?: string | null
          transaction_type?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "book_stock_transactions_book_item_id_fkey"
            columns: ["book_item_id"]
            isOneToOne: false
            referencedRelation: "book_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_stock_transactions_book_set_id_fkey"
            columns: ["book_set_id"]
            isOneToOne: false
            referencedRelation: "book_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_stock_transactions_supplier_transaction_id_fkey"
            columns: ["supplier_transaction_id"]
            isOneToOne: false
            referencedRelation: "supplier_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string | null
          admission_fee: number | null
          annual_charges: number | null
          class_type: Database["public"]["Enums"]["class_type"]
          created_at: string | null
          id: string
          is_active: boolean | null
          monthly_fee: number
          name: string
          syllabus_type_id: string | null
          teacher_id: string | null
        }
        Insert: {
          academic_year?: string | null
          admission_fee?: number | null
          annual_charges?: number | null
          class_type?: Database["public"]["Enums"]["class_type"]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          monthly_fee: number
          name: string
          syllabus_type_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          academic_year?: string | null
          admission_fee?: number | null
          annual_charges?: number | null
          class_type?: Database["public"]["Enums"]["class_type"]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          monthly_fee?: number
          name?: string
          syllabus_type_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_syllabus_type_id_fkey"
            columns: ["syllabus_type_id"]
            isOneToOne: false
            referencedRelation: "syllabus_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_payments: {
        Row: {
          amount_paid: number
          collection_id: string
          created_at: string | null
          id: string
          notes: string | null
          parent_id: string
          payment_date: string | null
          payment_method: string
          receipt_number: string
          recorded_by: string | null
          student_id: string | null
        }
        Insert: {
          amount_paid: number
          collection_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          parent_id: string
          payment_date?: string | null
          payment_method: string
          receipt_number?: string
          recorded_by?: string | null
          student_id?: string | null
        }
        Update: {
          amount_paid?: number
          collection_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          parent_id?: string
          payment_date?: string | null
          payment_method?: string
          receipt_number?: string
          recorded_by?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_payments_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_payments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          amount: number | null
          class_names: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_class_specific: boolean | null
          name: string
        }
        Insert: {
          amount?: number | null
          class_names?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_class_specific?: boolean | null
          name: string
        }
        Update: {
          amount?: number | null
          class_names?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_class_specific?: boolean | null
          name?: string
        }
        Relationships: []
      }
      concession_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      fee_payments: {
        Row: {
          amount_paid: number
          base_fee: number
          created_at: string | null
          id: string
          individual_discount: number | null
          month: string
          net_amount: number
          notes: string | null
          parent_id: string
          payment_date: string | null
          payment_method: string
          payment_year: number
          receipt_number: string
          recorded_by: string | null
          sibling_discount: number | null
          student_id: string
          total_discount: number | null
        }
        Insert: {
          amount_paid: number
          base_fee: number
          created_at?: string | null
          id?: string
          individual_discount?: number | null
          month: string
          net_amount: number
          notes?: string | null
          parent_id: string
          payment_date?: string | null
          payment_method: string
          payment_year?: number
          receipt_number: string
          recorded_by?: string | null
          sibling_discount?: number | null
          student_id: string
          total_discount?: number | null
        }
        Update: {
          amount_paid?: number
          base_fee?: number
          created_at?: string | null
          id?: string
          individual_discount?: number | null
          month?: string
          net_amount?: number
          notes?: string | null
          parent_id?: string
          payment_date?: string | null
          payment_method?: string
          payment_year?: number
          receipt_number?: string
          recorded_by?: string | null
          sibling_discount?: number | null
          student_id?: string
          total_discount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          notes: string | null
          parent_id: string
          payment_method: string | null
          recorded_by: string | null
          transaction_date: string
          transaction_number: string
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          parent_id: string
          payment_method?: string | null
          recorded_by?: string | null
          transaction_date?: string
          transaction_number?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          parent_id?: string
          payment_method?: string | null
          recorded_by?: string | null
          transaction_date?: string
          transaction_number?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_transactions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          address: string | null
          cnic: string
          created_at: string | null
          current_balance: number | null
          father_name: string
          id: string
          parent_id: string
          phone: string
          phone_secondary: string | null
          total_charged: number | null
          total_paid: number | null
        }
        Insert: {
          address?: string | null
          cnic: string
          created_at?: string | null
          current_balance?: number | null
          father_name: string
          id?: string
          parent_id: string
          phone: string
          phone_secondary?: string | null
          total_charged?: number | null
          total_paid?: number | null
        }
        Update: {
          address?: string | null
          cnic?: string
          created_at?: string | null
          current_balance?: number | null
          father_name?: string
          id?: string
          parent_id?: string
          phone?: string
          phone_secondary?: string | null
          total_charged?: number | null
          total_paid?: number | null
        }
        Relationships: []
      }
      sibling_discounts: {
        Row: {
          applies_to_child_number: number
          approved_by: string | null
          created_at: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          parent_id: string
        }
        Insert: {
          applies_to_child_number: number
          approved_by?: string | null
          created_at?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          parent_id: string
        }
        Update: {
          applies_to_child_number?: number
          approved_by?: string | null
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sibling_discounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      student_concessions: {
        Row: {
          approved_by: string | null
          category_id: string
          created_at: string | null
          discount_type: string
          discount_value: number
          id: string
          notes: string | null
          student_id: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          approved_by?: string | null
          category_id: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          id?: string
          notes?: string | null
          student_id: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          approved_by?: string | null
          category_id?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          notes?: string | null
          student_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_concessions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "concession_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_concessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          base_fee: number | null
          class: string
          cnic: string | null
          created_at: string | null
          date_of_admission: string
          date_of_birth: string
          id: string
          is_active: boolean | null
          monthly_fee: number
          name: string
          parent_id: string
          passout_date: string | null
          passout_reason: string | null
          roll_number: string | null
          student_id: string
        }
        Insert: {
          base_fee?: number | null
          class: string
          cnic?: string | null
          created_at?: string | null
          date_of_admission?: string
          date_of_birth: string
          id?: string
          is_active?: boolean | null
          monthly_fee: number
          name: string
          parent_id: string
          passout_date?: string | null
          passout_reason?: string | null
          roll_number?: string | null
          student_id: string
        }
        Update: {
          base_fee?: number | null
          class?: string
          cnic?: string | null
          created_at?: string | null
          date_of_admission?: string
          date_of_birth?: string
          id?: string
          is_active?: boolean | null
          monthly_fee?: number
          name?: string
          parent_id?: string
          passout_date?: string | null
          passout_reason?: string | null
          roll_number?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_transactions: {
        Row: {
          amount: number
          bill_number: string | null
          created_at: string
          description: string
          id: string
          notes: string | null
          payment_method: string | null
          recorded_by: string | null
          supplier_id: string
          transaction_date: string
          transaction_number: string
          transaction_type: string
        }
        Insert: {
          amount: number
          bill_number?: string | null
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          recorded_by?: string | null
          supplier_id: string
          transaction_date?: string
          transaction_number?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          bill_number?: string | null
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          recorded_by?: string | null
          supplier_id?: string
          transaction_date?: string
          transaction_number?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          business_name: string
          cnic: string | null
          contact: string
          created_at: string
          created_by: string | null
          current_balance: number | null
          id: string
          is_active: boolean | null
          name: string
          opening_balance: number | null
          supplier_id: string
          total_billed: number | null
          total_paid: number | null
        }
        Insert: {
          address?: string | null
          business_name: string
          cnic?: string | null
          contact: string
          created_at?: string
          created_by?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          opening_balance?: number | null
          supplier_id: string
          total_billed?: number | null
          total_paid?: number | null
        }
        Update: {
          address?: string | null
          business_name?: string
          cnic?: string | null
          contact?: string
          created_at?: string
          created_by?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          opening_balance?: number | null
          supplier_id?: string
          total_billed?: number | null
          total_paid?: number | null
        }
        Relationships: []
      }
      syllabus_types: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          assigned_class: string | null
          cnic: string
          created_at: string
          created_by: string | null
          date_of_birth: string
          date_of_joining: string
          education: string
          employee_type: string
          father_name: string
          first_name: string
          home_address: string
          home_phone: string | null
          id: string
          institute: string
          is_active: boolean
          last_name: string
          personal_phone: string
          teacher_id: string
        }
        Insert: {
          assigned_class?: string | null
          cnic: string
          created_at?: string
          created_by?: string | null
          date_of_birth: string
          date_of_joining?: string
          education: string
          employee_type?: string
          father_name: string
          first_name: string
          home_address: string
          home_phone?: string | null
          id?: string
          institute: string
          is_active?: boolean
          last_name: string
          personal_phone: string
          teacher_id: string
        }
        Update: {
          assigned_class?: string | null
          cnic?: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string
          date_of_joining?: string
          education?: string
          employee_type?: string
          father_name?: string
          first_name?: string
          home_address?: string
          home_phone?: string | null
          id?: string
          institute?: string
          is_active?: boolean
          last_name?: string
          personal_phone?: string
          teacher_id?: string
        }
        Relationships: []
      }
      transaction_line_items: {
        Row: {
          amount: number
          collection_id: string | null
          created_at: string
          description: string
          id: string
          item_type: string
          month: string | null
          student_id: string | null
          transaction_id: string
        }
        Insert: {
          amount: number
          collection_id?: string | null
          created_at?: string
          description: string
          id?: string
          item_type: string
          month?: string | null
          student_id?: string | null
          transaction_id: string
        }
        Update: {
          amount?: number
          collection_id?: string | null
          created_at?: string
          description?: string
          id?: string
          item_type?: string
          month?: string | null
          student_id?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_line_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_line_items_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_line_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "parent_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_sibling_discount: {
        Args: { child_number: number; parent_uuid: string }
        Returns: number
      }
      generate_book_sale_number: { Args: never; Returns: string }
      generate_parent_id: { Args: { father_name: string }; Returns: string }
      generate_receipt_number: { Args: never; Returns: string }
      generate_student_id: { Args: { student_name: string }; Returns: string }
      generate_supplier_id: { Args: { supplier_name: string }; Returns: string }
      generate_supplier_transaction_number: { Args: never; Returns: string }
      generate_teacher_id: {
        Args: { first_name: string; last_name: string }
        Returns: string
      }
      generate_transaction_number: { Args: never; Returns: string }
      get_net_fee: { Args: { student_uuid: string }; Returns: number }
      get_student_outstanding_collections: {
        Args: never
        Returns: {
          amount_paid: number
          class: string
          collection_id: string
          collection_name: string
          description: string
          outstanding_amount: number
          parent_id: string
          student_id: string
          student_name: string
          suggested_amount: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "user"
      class_type: "regular" | "passout"
      transaction_type: "income" | "expense"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "user"],
      class_type: ["regular", "passout"],
      transaction_type: ["income", "expense"],
    },
  },
} as const
