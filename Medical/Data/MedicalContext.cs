using Microsoft.EntityFrameworkCore;
using Medical.Models;

namespace Medical.Data
{
    public class MedicalContext : DbContext
    {
        public MedicalContext(DbContextOptions<MedicalContext> options)
            : base(options)
        {
        }

        public DbSet<ViewPublicForm> ViewPublicForm { get; set; }
        //public DbSet<FormLabelHistory> FormLabelHistory { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure ViewPublicForm entity
            modelBuilder.Entity<ViewPublicForm>(entity =>
            {
                entity.HasKey(e => e.ViewPublicFormId);
                entity.Property(e => e.ViewPublicFormId).ValueGeneratedNever();
            });

            
        }
    }
}