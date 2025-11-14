import pool from "../config/db/db_config.js"; // PostgreSQL connection pool

export const PlansModel = {
  async createPlan({ plan_name, gb, status = true }) {
    const query = `
      INSERT INTO plans (plan_name, gb, status)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [plan_name, gb, status];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async showAllPlans() {
    const query = `SELECT * FROM plans ORDER BY created_at DESC;`;
    const { rows } = await pool.query(query);
    return rows;
  },

  async getPlanById(plan_id) {
    const query = `SELECT * FROM plans WHERE plan_id = $1;`;
    const { rows } = await pool.query(query, [plan_id]);
    return rows[0] || null;
  },

  async updatePlan(plan_id, { plan_name, gb, status }) {
    const query = `
      UPDATE plans 
      SET 
        plan_name = COALESCE($1, plan_name),
        gb = COALESCE($2, gb),
        status = COALESCE($3, status),
        updated_at = NOW()
      WHERE plan_id = $4
      RETURNING *;
    `;
    const values = [plan_name, gb, status, plan_id];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  },

  async togglePlanStatus(plan_id) {
    const query = `
      UPDATE plans
      SET status = NOT status,
          updated_at = NOW()
      WHERE plan_id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [plan_id]);
    return rows[0] || null;
  },
};
